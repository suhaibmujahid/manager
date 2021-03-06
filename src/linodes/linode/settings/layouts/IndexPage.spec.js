import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';

import { testLinode1235 } from '~/data/linodes';
import { IndexPage } from '~/linodes/linode/settings/layouts/IndexPage';

describe('linodes/linode/settings/layouts/IndexPage', () => {
  const sandbox = sinon.sandbox.create();
  const dispatch = sandbox.spy();

  afterEach(() => {
    dispatch.reset();
    sandbox.restore();
  });

  it('should render without error', () => {
    const dispatch = jest.fn();
    const wrapper = shallow(
      <IndexPage
        dispatch={dispatch}
        linode={testLinode1235}
      >
        <div></div>
      </IndexPage>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it.skip('renders tabs with correct names and links', () => {
    const page = mount(
      <IndexPage
        dispatch={dispatch}
        linode={testLinode1235}
      >
        <div></div>
      </IndexPage>
    );

    const tabList = [
      { name: 'Display', link: '/' },
      { name: 'Alerts', link: '/alerts' },
      { name: 'Advanced', link: '/advanced' },
    ].map(t => ({ ...t, link: `/linodes/test-linode-1/settings${t.link}` }));

    const tabs = page.find('Tabs').find('Tab');
    expect(tabs.length).toBe(tabList.length);
    tabList.forEach(({ name }, i) => {
      expect(tabs.at(i).children().text()).toBe(name);
    });
  });
});
