import pickBy from 'lodash/pickBy';
import flatten from 'lodash/flatten';
import merge from 'lodash/merge';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Card, CardHeader } from 'linode-components';
import {
  Form,
  FormGroup,
  FormSummary,
  SubmitButton,
} from 'linode-components';
import { Table } from 'linode-components';
import {
  CheckboxCell,
  LinkCell,
} from 'linode-components';

import { setSource } from '~/actions/source';
import { setShared } from '~/api/ad-hoc/networking';
import { dispatchOrStoreErrors } from '~/api/util';
import { IPRdnsCell } from '~/components/tables/cells';

import { IPTransferPage } from './IPTransferPage';
import { selectLinode } from '../../utilities';


export class IPSharingPage extends Component {
  static preload = IPTransferPage.preload;

  constructor(props) {
    super(props);

    this.state = {
      errors: {},
      loading: false,
      checked: {},
    };

    this.componentWillReceiveProps = this.componentWillMount;
  }

  componentWillMount() {
    const { linode, linodes } = this.props;

    // Although we only explicitly looked up all linodes in the current dc,
    // other linodes may already exist in the state.
    const linodesInRegion = Object.values(linodes).filter(l =>
      l.region === linode.region);

    this.setState({ linodesInRegion }, () => {
      const checked = {};
      const validIPs = this.validIPs();

      validIPs.forEach(({ ip: { address } }) => {
        checked[address] = Object.values(linode._shared).filter(ip =>
          ip.address === address).length !== 0;
      });

      this.setState({
        checked: merge({}, checked, this.state ? this.state.checked : {}),
      });
    });
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(setSource(__filename));
  }

  onChange = (record, checked) => {
    this.setState(merge({}, this.state, {
      checked: {
        [record.ip.address]: checked,
      },
    }));
  }

  onSubmit = () => {
    const { dispatch, linode } = this.props;
    const { checked } = this.state;

    const sharedIPsKeys = pickBy(checked, checked => checked);
    const sharedIPs = this.validIPs().map(({ ip }) => ip).filter(
      ({ address }) => address in sharedIPsKeys);

    return dispatch(dispatchOrStoreErrors.call(this, [
      () => setShared(linode.id, sharedIPs),
    ]));
  }

  validIPs() {
    const { linode: thisLinode } = this.props;
    const { linodesInRegion } = this.state;

    const data = flatten(linodesInRegion
      .filter((linode) => linode.id !== thisLinode.id)
      .map(function (linode) {
        const shareableIps = Object.values(linode._ips).filter(
          ip => ip.type === 'public' && ip.version === 'ipv4');

        return shareableIps.map((ip) => {
          return { ip: ip, linode: linode };
        });
      }));

    return data;
  }

  render() {
    const { errors, loading, checked } = this.state;

    const data = this.validIPs();

    let body = (
      <p>
        Sharing is limited to Linodes in the same region. You have no other Linodes
        in this region.
      </p>
    );

    if (data.length) {
      body = (
        <div>
          <p>
            <small>
              The selected IP addresses can be brought up by this Linode if the original Linode's
              host becomes unavailable.
            </small>
          </p>
          <Form
            onSubmit={this.onSubmit}
            analytics={{ title: 'IP sharing settings' }}
          >
            <FormGroup name="ip-sharing">
              <Table
                className="Table--secondary"
                columns={[
                  {
                    cellComponent: CheckboxCell,
                    headerClassName: 'CheckboxColumn',
                    selectedKeyFn: (record) => record.ip.address,
                  },
                  { cellComponent: IPRdnsCell, ipKey: 'ip', label: 'IP Address' },
                  {
                    cellComponent: LinkCell,
                    hrefFn: (record) => `/linodes/${record.linode.label}`,
                    label: 'Linode',
                    textFn: (record) => record.linode.label,
                  },
                ]}
                data={data}
                selectedMap={checked}
                onToggleSelect={this.onChange}
              />
            </FormGroup>
            <FormGroup>
              <SubmitButton disabled={loading} />
              <FormSummary errors={errors} success="Shared IPs saved." />
            </FormGroup>
          </Form>
        </div>
      );
    }

    return (
      <Card header={<CardHeader title="IP Sharing" />}>{body}</Card>
    );
  }
}


IPSharingPage.propTypes = {
  linodes: PropTypes.object.isRequired,
  linode: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function select(state, props) {
  const { linode } = selectLinode(state, props);
  const { linodes } = state.api.linodes;
  return { linode, linodes };
}

export default connect(select)(IPSharingPage);
