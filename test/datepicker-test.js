import React from 'react';
import moment from 'moment';
import expect, { createSpy } from 'expect';
import Datepicker from '../src/Datepicker';
import Textfield from '../src/Textfield';
import Button from '../src/Button';
import Calendar from '../src/Calendar';
import Clock from '../src/Clock';
import { shallow } from 'enzyme';

const DEFAULT_DATE_VAL_FORMAT = 'YYYY-MM-DD';
const DEFAULT_TIME_VAL_FORMAT = 'HH:mm';
const DEFAULT_DATE_TIME_VAL_FORMAT = `${ DEFAULT_DATE_VAL_FORMAT } ${ DEFAULT_TIME_VAL_FORMAT }`;

describe('Datepicker', () => {
  it('default', () => {
    const tree = shallow(<Datepicker type="datetime" />);
    expect(tree.hasClass('coral-Datepicker')).toBe(true);
    expect(tree.hasClass('is-invalid')).toBe(false);

    const textfield = findTextfield(tree);
    expect(textfield.hasClass('coral-InputGroup-input')).toBe(true);
    expect(textfield.prop('aria-invalid')).toBe(false);
    expect(textfield.prop('readOnly')).toBe(false);
    expect(textfield.prop('disabled')).toBe(false);
    expect(textfield.prop('invalid')).toBe(false);
    expect(textfield.prop('quiet')).toBe(false);

    const button = findButton(tree);
    expect(button.parent().hasClass('coral-InputGroup-button')).toBe(true);
    expect(button.prop('icon')).toBe('calendar');
    expect(button.prop('disabled')).toBe(false);
    expect(button.hasClass('coral-Button--quiet')).toBe(false);

    const calendar = findCalendar(tree);
    expect(calendar.hasClass('u-coral-borderless')).toBe(true);
    expect(calendar.prop('disabled')).toBe(false);
    expect(calendar.prop('invalid')).toBe(false);
    expect(calendar.prop('readOnly')).toBe(false);
    expect(calendar.prop('required')).toBe(false);

    const clock = findClock(tree);
    expect(clock.parent().hasClass('coral-Datepicker-clockContainer')).toBe(true);
    expect(clock.prop('disabled')).toBe(false);
    expect(clock.prop('invalid')).toBe(false);
    expect(clock.prop('readOnly')).toBe(false);
    expect(clock.prop('required')).toBe(false);
  });

  it('supports type (date, time, and datetime)', () => {
    const tree = shallow(<Datepicker type="date" />);
    expect(findCalendar(tree).node).toExist();
    expect(findClock(tree).node).toNotExist();
    expect(findButton(tree).prop('icon')).toBe('calendar');

    tree.setProps({ type: 'datetime' });
    expect(findCalendar(tree).node).toExist();
    expect(findClock(tree).node).toExist();
    expect(findButton(tree).prop('icon')).toBe('calendar');

    tree.setProps({ type: 'time' });
    expect(findCalendar(tree).node).toNotExist();
    expect(findClock(tree).node).toExist();
    expect(findButton(tree).prop('icon')).toBe('clock');
  });

  it('supports defaultValue uncontrolled behavior', () => {
    const now = moment();
    const tree = shallow(<Datepicker defaultValue={ now } />);

    // Setting defaultValue later doesn't change the state. Only component interactions
    // change the state.
    tree.setProps({ defaultValue: now.clone().add(7, 'day') });
    expect(+tree.state('value')).toEqual(+now);

    // Component interaction should change the state.
    findTextfield(tree).simulate('change', { target: { value: '2016-08-01' } });
    expect(+tree.state('value')).toEqual(+(new Date(2016, 7, 1)));
  });

  it('supports value controlled behavior', () => {
    const now = moment();
    const dateWeekLater = now.clone().add(7, 'day');

    const tree = shallow(<Datepicker value={ now } />);

    // Changing value will change the state
    tree.setProps({ value: dateWeekLater });
    expect(+tree.state('value')).toEqual(+dateWeekLater);

    // Component interaction should not change the state, only manually setting value
    // as a prop will change the state.
    findTextfield(tree).simulate('change', { target: { value: '2016-08-01' } });
    expect(+tree.state('value')).toEqual(+dateWeekLater);
  });

  it('clicking Button opens Popover', () => {
    const tree = shallow(<Datepicker />);
    expect(tree.state('open')).toBe(false);
    findButton(tree).simulate('click');
    expect(tree.state('open')).toBe(true);
    expect(tree.prop('open')).toBe(true);
  });

  describe('closing popover', () => {
    it('typing escape while popover is open closes popover', () => {
      const tree = shallow(<Datepicker type="datetime" />);
      tree.setState({ open: true });
      findCalendar(tree).simulate('keydown', { keyCode: 27 });
      expect(tree.state('open')).toBe(false);
      tree.setState({ open: true });
      findClock(tree).simulate('keydown', { keyCode: 27 });
      expect(tree.state('open')).toBe(false);
    });

    it('clicking a date on the calendar closes popover', () => {
      const now = moment();
      const tree = shallow(<Datepicker />);
      tree.setState({ open: true });
      findCalendar(tree).simulate('change', now.toString(), now.toDate());
      expect(tree.state('open')).toBe(false);
    });

    it('popover can close itself', () => {
      const tree = shallow(<Datepicker />);
      tree.prop('onClose')();
      expect(tree.state('open')).toBe(false);
    });
  });

  describe('onChange', () => {
    let spy;
    let tree;
    const assertChangeArgs = (el, args, inputText, date) => {
      args.unshift('change');
      el.simulate.apply(el, args);
      const callArgs = spy.getLastCall().arguments;
      expect(callArgs[0]).toBe(inputText);
      expect(+callArgs[1]).toEqual(+date);
    };

    beforeEach(() => {
      spy = createSpy();
      tree = shallow(<Datepicker type="datetime" onChange={ spy } />);
    });

    it('textfield onChange', () => {
      const textfield = findTextfield(tree);
      assertChangeArgs(
        textfield,
        [{ target: { value: '2016-08-01' } }],
        '2016-08-01',
        new Date(2016, 7, 1)
      );
      assertChangeArgs(textfield, [{ target: { value: 'foo' } }], 'foo', NaN);
    });

    it('calendar onChange', () => {
      const calendar = findCalendar(tree);
      const text = '2016-08-01';
      const date = moment(text, DEFAULT_DATE_VAL_FORMAT).toDate();
      assertChangeArgs(calendar, [text, date], text, date);
    });

    it('clock onChange', () => {
      const calendar = findCalendar(tree);
      const text = '2016-08-01 12:35:00';
      const date = moment(text, DEFAULT_DATE_TIME_VAL_FORMAT).toDate();
      assertChangeArgs(calendar, [text, date], text, date);
    });
  });

  it('supports placeholder', () => {
    const tree = shallow(<Datepicker placeholder="foo" />);
    expect(findTextfield(tree).prop('placeholder')).toBe('foo');
  });

  it('supports quiet', () => {
    const tree = shallow(<Datepicker quiet />);
    expect(tree.childAt(0).hasClass('coral-InputGroup--quiet')).toBe(true);
    expect(findTextfield(tree).prop('quiet')).toBe(true);
    expect(findButton(tree).hasClass('coral-Button--quiet')).toBe(true);
  });

  it('supports disabled', () => {
    const tree = shallow(<Datepicker type="datetime" disabled />);
    expect(tree.prop('aria-disabled')).toBe(true);
    expect(findTextfield(tree).prop('disabled')).toBe(true);
    expect(findButton(tree).prop('disabled')).toBe(true);
    expect(findCalendar(tree).prop('disabled')).toBe(true);
    expect(findClock(tree).prop('disabled')).toBe(true);
  });

  it('supports invalid', () => {
    const tree = shallow(<Datepicker type="datetime" invalid />);
    expect(tree.prop('aria-invalid')).toBe(true);
    expect(tree.hasClass('is-invalid')).toBe(true);
    expect(findTextfield(tree).prop('invalid')).toBe(true);
    expect(findTextfield(tree).prop('aria-invalid')).toBe(true);
    expect(findCalendar(tree).prop('invalid')).toBe(true);
    expect(findClock(tree).prop('invalid')).toBe(true);
  });

  it('supports readOnly', () => {
    const tree = shallow(<Datepicker type="datetime" readOnly />);
    expect(tree.prop('aria-readonly')).toBe(true);
    expect(findTextfield(tree).prop('readOnly')).toBe(true);
    expect(findButton(tree).prop('disabled')).toBe(true);
    expect(findCalendar(tree).prop('readOnly')).toBe(true);
    expect(findClock(tree).prop('readOnly')).toBe(true);
  });

  it('supports required', () => {
    const tree = shallow(<Datepicker type="datetime" required />);
    expect(tree.prop('aria-required')).toBe(true);
    expect(findCalendar(tree).prop('required')).toBe(true);
    expect(findClock(tree).prop('required')).toBe(true);
  });

  it('supports additional classNames', () => {
    const tree = shallow(<Datepicker className="myClass" />);
    expect(tree.hasClass('myClass')).toBe(true);
  });

  it('supports additional properties', () => {
    const tree = shallow(<Datepicker foo />);
    expect(findTextfield(tree).prop('foo')).toBe(true);
  });
});

const findTextfield = tree => tree.find(Textfield);
const findButton = tree => tree.find(Button);
const findCalendar = tree => shallow(tree.prop('content')).find(Calendar);
const findClock = tree => shallow(tree.prop('content')).find(Clock);