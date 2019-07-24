/* eslint-disable react/prop-types */

import React, { lazy, Component } from 'react';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import UIkit from 'uikit';
import axios from 'axios';
import { remove as removeCookie } from 'es-cookie';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { history } from '../../../../../shared/store/configureStore';

import appDataRuntimeSetToken from '../../../../../shared/actions/appDataRuntimeSetToken';
import appLinguiSetCatalog from '../../../../../shared/actions/appLinguiSetCatalog';
import appDataSetUser from '../../../../../shared/actions/appDataSetUser';
import config from '../../../../../etc/config.json';
import basesListTableSetState from '../../actions/basesListTableSetState';
import appDataRuntimeSetDocumentTitle from '../../../../../shared/actions/appDataRuntimeSetDocumentTitle';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../../shared/components/AdminPanel/AdminPanel.jsx'));
const Table = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "Table" */ '../../../../../shared/components/Table/index.jsx'));
const DialogDelete = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "BasesDialogDelete" */ './DialogDelete.jsx'));

class BasesList extends Component {
    constructor(props) {
        super(props);
        this.basesListTable = React.createRef();
        this.dialogDelete = React.createRef();
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/users/auth?redirect=/admin/bases');
        } else {
            const query = queryString.parse(window.location.search);
            if (query.reload && this.basesListTable.current) {
                this.basesListTable.current.reloadURL();
            }
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        removeCookie(`${config.siteId}_auth`);
        history.push(`/users/auth?redirect=/admin/bases`);
    }

    onBasesTableLoadError = res => {
        if (res && res.status === 403) {
            this.deauthorize();
            this.props.basesListTableSetStateAction({});
        }
    }

    onBasesTableSaveError = (data, i18n) => {
        if (data) {
            if (data.statusCode === 403) {
                this.deauthorize();
            }
            switch (data.errorCode) {
                case 1:
                    UIkit.notification(i18n._(t`Record with the entered value already exists`), { status: 'danger' });
                    break;
                case 2:
                    UIkit.notification(i18n._(t`Invalid format`), { status: 'danger' });
                    break;
                default:
                    UIkit.notification(i18n._(t`Could not save data`), { status: 'danger' });
            }
        } else {
            UIkit.notification(i18n._(t`Could not save data`), { status: 'danger' });
        }
    }

    onTableStateUpdated = state => this.props.basesListTableSetStateAction(state);

    onDeleteRecord = (id, e) => {
        if (e) {
            e.preventDefault();
        }
        const ids = [];
        const bases = [];
        const basesListTable = this.basesListTable.current;
        if (id && e) {
            ids.push(id);
            const data = basesListTable.getCurrentData();
            bases.push(data.name[id]);
        } else {
            const data = basesListTable.getCheckboxData();
            data.map(i => {
                ids.push(i._id);
                bases.push(i.name);
            });
        }
        if (ids.length) {
            this.dialogDelete.current.show(bases, ids);
        }
    }

    onDeleteButtonClick = (ids, i18n) => {
        this.dialogDelete.current.hide();
        this.basesListTable.current.setLoading(true);
        axios.post(`${config.apiURL}/api/bases/delete`, {
            token: this.props.appDataRuntime.token,
            ids
        }, { headers: { 'content-type': 'application/json' } }).then(res => {
            this.basesListTable.current.setLoading(false);
            if (res.data.statusCode !== 200) {
                return UIkit.notification(i18n._(t`Cannot delete one or more bases`), { status: 'danger' });
            }
            this.basesListTable.current.reloadURL();
            return UIkit.notification(i18n._(t`Operation complete`), { status: 'success' });
        }).catch(() => this.basesListTable.current.setLoading(false) && UIkit.notification(i18n._(t`Cannot delete one or more bases`), { status: 'danger' }));
    }

    processActions = (val, row, i18n) => (<>
        <Link to={`/admin/bases/edit/${row._id}`} className="uk-icon-button" uk-icon="pencil" uk-tooltip={`title: ${i18n._(t`Edit`)}`} />
        &nbsp;
        <a href="" className="uk-icon-button" uk-icon="trash" uk-tooltip={`title: ${i18n._(t`Delete`)}`} onClick={e => this.onDeleteRecord(row._id, e)} />
    </>);

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(t`Bases`), this.props.appData.language);
                    return (<>
                        <div className="uk-text-lead uk-margin-bottom">{i18n._(t`Bases`)}</div>
                        <Table
                            prefix="basesListTable"
                            ref={this.basesListTable}
                            initialState={this.props.basesList.basesTableState}
                            onStateUpdated={this.onTableStateUpdated}
                            i18n={i18n}
                            UIkit={UIkit}
                            axios={axios}
                            topButtons={<><Link to="/admin/bases/add" className="uk-icon-button uk-button-primary uk-margin-small-right" uk-icon="plus" uk-tooltip={i18n._(t`Create new base`)} /><button type="button" className="uk-icon-button uk-button-danger" uk-icon="trash" uk-tooltip={i18n._(t`Delete selected bases`)} onClick={this.onDeleteRecord} /></>}
                            columns={[{
                                id: 'name',
                                title: 'Base',
                                sortable: true,
                                cssHeader: 'uk-text-nowrap'
                            }, {
                                id: 'actions',
                                title: 'Actions',
                                cssRow: 'uk-table-shrink uk-text-nowrap ztable-noselect',
                                process: (val, row) => this.processActions(val, row, i18n)
                            }]}
                            itemsPerPage={config.commonItemsLimit}
                            source={{
                                url: `${config.apiURL}/api/bases/list`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token,
                                    language: this.props.appData.language
                                }
                            }}
                            save={{
                                url: `${config.apiURL}/api/bases/saveField`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token
                                }
                            }}
                            sortColumn="name"
                            sortDirection="asc"
                            lang={{
                                LOADING: i18n._(t`Loading data, please wait…`),
                                NO_RECORDS: i18n._(t`No records to display`),
                                ERROR_LOAD: i18n._(t`Could not load data`),
                                ERROR_SAVE: i18n._(t`Could not save data`),
                                ERR_VMANDATORY: i18n._(t`Field is required`),
                                ERR_VFORMAT: i18n._(t`Invalid format`)
                            }}
                            onLoadError={this.onBasesTableLoadError}
                            onSaveError={data => this.onBasesTableSaveError(data, i18n)}
                        />
                        <DialogDelete
                            ref={this.dialogDelete}
                            i18n={i18n}
                            onDeleteButtonClickHandler={ids => this.onDeleteButtonClick(ids, i18n)}
                        />
                    </>);
                }}
            </I18n>
        </AdminPanel>
    );
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime,
    appLingui: store.appLingui,
    basesList: store.basesList
}),
    dispatch => ({
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        basesListTableSetStateAction: state => dispatch(basesListTableSetState(state)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language))
    }))(BasesList);
