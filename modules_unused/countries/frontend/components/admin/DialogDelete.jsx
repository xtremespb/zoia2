/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from '@lingui/macro';
import UIkit from '../../../../../shared/utils/uikit';

class DialogDelete extends Component {
    state = {
        countries: [],
        ids: []
    }

    componentDidMount = () => {
        this.dialogDelete = UIkit.modal(`#dialogDelete_${this.props.id}`, {
            bgClose: true,
            escClose: true,
            stack: false
        });
    }

    componentWillUnmount = () => {
        this.dialogDelete.$destroy(true);
    }

    show = (countries, ids) => {
        this.setState({
            countries,
            ids
        });
        this.dialogDelete.show();
    }

    hide = () => {
        this.dialogDelete.hide();
    }

    onDeleteButtonClick = e => {
        e.preventDefault();
        if (this.props.onDeleteButtonClickHandler && typeof this.props.onDeleteButtonClickHandler === 'function') {
            this.props.onDeleteButtonClickHandler(this.state.ids);
        }
        this.hide();
    }

    render = () => (<div>
        <div id={`dialogDelete_${this.props.id}`} style={{ display: 'none' }}>
            <div className="uk-modal-dialog">
                <div className="uk-modal-body">
                    <p>{this.props.i18n._(t`The following country(ies) will be permanently deleted:`)}</p>
                    <div uk-alert="true">{this.state.countries.join(', ')}</div>
                </div>
                <div className="uk-modal-footer uk-text-right">
                    <button className="uk-button uk-button-default uk-modal-close uk-margin-small-right" type="button">{this.props.i18n._(t`Cancel`)}</button>
                    <button className="uk-button uk-button-primary" type="button" onClick={this.onDeleteButtonClick}>{this.props.i18n._(t`Delete`)}</button>
                </div>
            </div>
        </div>
    </div>);
}

export default connect(store => ({
    countriesList: store.countriesList
}),
    () => ({}), null, { forwardRef: true })(DialogDelete);