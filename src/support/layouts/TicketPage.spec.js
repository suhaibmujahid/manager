import { mount, shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { MAX_UPLOAD_SIZE_MB } from '~/constants';
import { TicketPage } from '~/support/layouts/TicketPage';

import { expectRequest, expectDispatchOrStoreErrors } from '~/test.helpers';
import { testTicket, closedTicket } from '~/data/tickets';
import { createSimulatedEvent } from '../../test.helpers';


describe('support/layouts/TicketPage', () => {
  const sandbox = sinon.sandbox.create();

  afterEach(() => {
    sandbox.restore();
  });

  it('should render without error', () => {
    const mockDispatch = jest.fn();
    const wrapper = shallow(
      <TicketPage
        ticket={testTicket}
        replies={testTicket._replies.replies}
        dispatch={mockDispatch}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('renders each response', () => {
    const { replies } = testTicket._replies;
    const page = mount(
      <TicketPage
        ticket={testTicket}
        replies={testTicket._replies.replies}
        dispatch={() => { }}
      />
    );

    // original ticket + ticket responses
    expect(page.find('TicketReply').length).toBe(1 + Object.values(replies).length);
  });

  it('hide response options when ticket is closed', () => {
    const dispatch = sandbox.spy();
    const page = mount(
      <TicketPage
        ticket={closedTicket}
        replies={closedTicket._replies.replies}
        dispatch={dispatch}
      />
    );

    expect(page.find('Form').length).toBe(0);
    const ticketClosedText = mount(page.instance().renderTicketClosed()).text();
    expect(page.find('#ticket-closed .Card-body').text()).toBe(ticketClosedText);
  });

  it('sends a reply on submit if a reply is there', async () => {
    const dispatch = sandbox.spy();
    const page = mount(
      <TicketPage
        ticket={testTicket}
        replies={testTicket._replies.replies}
        dispatch={dispatch}
      />
    );

    const reply = 'This is my awesome response.';
    const replyWrapper = page.find('textarea#reply[name="reply"]');
    replyWrapper.simulate(
      'change',
      createSimulatedEvent('reply', reply)
    );

    dispatch.reset();
    await page.find('Form').props().onSubmit();

    // No attachments, so save attachment endpoint not called.
    expect(dispatch.callCount).toBe(1);
    await expectDispatchOrStoreErrors(dispatch.firstCall.args[0], [
      ([fn]) => expectRequest(fn, `/support/tickets/${testTicket.id}/replies/`, {
        method: 'POST',
        body: { description: reply },
      }),
    ]);
  });

  it('sends attachments on submit if attachments are there', async () => {
    const dispatch = sandbox.spy();
    const page = mount(
      <TicketPage
        ticket={testTicket}
        replies={testTicket._replies.replies}
        dispatch={dispatch}
      />
    );

    const attachments = [{ size: (MAX_UPLOAD_SIZE_MB - 0.5) * 1024 * 1024 }];
    page.instance().setState({ attachments });

    dispatch.reset();
    await page.find('Form').props().onSubmit();

    expect(dispatch.callCount).toBe(1);
    await expectDispatchOrStoreErrors(dispatch.firstCall.args[0], [
      ([fn]) => expectRequest(fn, `/support/tickets/${testTicket.id}/attachments`, {
        method: 'POST',
      }),
    ]);
  });

  it('doesn\'t allow attachments bigger than MAX_UPLOAD_SIZE_MB', async () => {
    const dispatch = sandbox.spy();
    const page = mount(
      <TicketPage
        ticket={testTicket}
        replies={testTicket._replies.replies}
        dispatch={dispatch}
      />
    );

    const attachments = [{ size: (MAX_UPLOAD_SIZE_MB + 1) * 1024 * 1024 }];
    // This is a rare place where the only way to set this is by directly modifying state.
    page.instance().setState({ attachments });

    dispatch.reset();
    await page.find('Form').props().onSubmit();

    expect(dispatch.callCount).toBe(1);
    // Only attempting to upload an attachment
    await expectDispatchOrStoreErrors(dispatch.firstCall.args[0], [], 0);
    // But we've got errors
    expect(Object.values(page.state('errors')).length).toBe(2);
  });
});
