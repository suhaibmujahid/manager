import PropTypes from 'prop-types';
import React from 'react';

import capitalize from 'lodash/capitalize';
import { OAUTH_SUBSCOPES } from '~/constants';
import { TableCell } from 'linode-components';

function renderScope(scopesRequested, currentScope, currentSubscope) {
  const subscopeAllowed = (
    <small>
      <i className="fa fa-check" />
      {capitalize(currentSubscope)}
    </small>
  );
  const subscopeNotAllowed = (
    <small>
      <i className="fa fa-times" />
      {capitalize(currentSubscope)}
    </small>
  );

  if (scopesRequested === '*') {
    return subscopeAllowed;
  }

  const scopeList = scopesRequested.split(',');
  const scopeInQuestion = scopeList.filter(scope => scope.split(':')[0] === currentScope)[0];
  if (!scopeInQuestion) {
    return subscopeNotAllowed;
  }

  const [scope, subscope] = scopeInQuestion.split(':');
  const allScopes = scope === '*';
  const allSubscopes = subscope === '*';
  if (allScopes || allSubscopes) {
    return subscopeAllowed;
  }

  const indexOfSubscopeRequested = OAUTH_SUBSCOPES.indexOf(subscope);
  const indexOfCurrentSubscope = OAUTH_SUBSCOPES.indexOf(currentSubscope);
  if (indexOfSubscopeRequested >= indexOfCurrentSubscope) {
    return subscopeAllowed;
  }

  return subscopeNotAllowed;
}

export default function AuthScopeCell(props) {
  const { column, record } = props;

  return (
    <TableCell className="AuthScopeCell" column={column} record={record}>
      {renderScope(record.scopes, record.scope, column.subscope)}
    </TableCell>
  );
}

AuthScopeCell.propTypes = {
  column: PropTypes.shape({
    subscope: PropTypes.string.isRequired,
  }),
  record: PropTypes.shape({
    scopes: PropTypes.string.isRequired,
    scope: PropTypes.string.isRequired,
  }),
};
