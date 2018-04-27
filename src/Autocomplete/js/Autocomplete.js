import autobind from 'autobind-decorator';
import {chain, interpretKeyboardEvent} from '../../utils/events';
import classNames from 'classnames';
import createId from '../../utils/createId';
import {Menu, MenuItem} from '../../Menu';
import Overlay from '../../OverlayTrigger/js/Overlay';
import React from 'react';
import ReactDOM from 'react-dom';
import scrollToDOMNode from '../../utils/scrollToDOMNode';
import '../style/index.styl';

const getLabel = o => (typeof o === 'string' ? o : o.label);

const LISTBOX = '-listbox';
const OPTION = '-option-';

@autobind
export default class Autocomplete extends React.Component {
  static defaultProps = {
    allowCreate: false
  };

  state = {
    value: '',
    showDropdown: false,
    results: [],
    selectedIndex: -1,
    isFocused: false
  };

  constructor(props) {
    super(props);
    this.autocompleteId = createId();
  }

  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(props) {
    if (props.value != null && props.value !== this.state.value) {
      this.setValue(props.value);
    }
  }

  componentDidMount() {
    this.updateSize();
  }

  componentDidUpdate() {
    this.updateSize();
  }

  updateSize() {
    if (this.wrapper) {
      let width = this.wrapper.offsetWidth;
      if (width !== this.state.width) {
        this.setState({width});
      }
    }
  }

  onChange(value) {
    let {onChange} = this.props;
    if (onChange) {
      onChange(value);
    }

    if (this.props.value == null) {
      this.setValue(value);
    }
  }

  setValue(value) {
    this.setState({
      value,
      showDropdown: this.state.isFocused,
      selectedIndex: this.props.allowCreate && this.state.selectedIndex === -1 ? -1 : 0
    });

    this.getCompletions(value);
  }

  async getCompletions(value) {
    this.optionIdPrefix = this.optionIdPrefix || this.autocompleteId + LISTBOX;
    this._value = value;

    let results = [];
    let {getCompletions} = this.props;
    if (getCompletions) {
      results = await getCompletions(value);
    }

    // Avoid race condition where two getCompletions calls are made in parallel.
    if (this._value === value) {
      this.setState({results}, () => {
        const list = ReactDOM.findDOMNode(this.getListRef());
        if (list) {
          list.scrollTop = 0;
        }
      });

      return results;
    }

    return this.state.results;
  }

  onSelect(value, event) {
    this.onChange(typeof value === 'string' ? value : value.label);
    this.hideMenu();

    if (this.props.onSelect) {
      this.props.onSelect(value, event);
    }
  }

  onFocus() {
    this.setState({isFocused: true});
  }

  onBlur() {
    this.hideMenu();
    this.setState({isFocused: false});
  }

  onEscape(event) {
    event.preventDefault();
    this.hideMenu();
  }

  onSelectFocused(event) {
    // Autocomplete should accept space key as text entry
    if (event.key === ' ') {
      return;
    }
    const {results = [], selectedIndex} = this.state;
    let value = results[selectedIndex];
    if (value) {
      event.preventDefault();
      this.onSelect(value, event);
    } else if (this.props.allowCreate) {
      if (event.key !== 'Tab') {
        event.preventDefault();
      }
      this.onSelect(this.state.value, event);
    }
  }

  onFocusFirst(event) {
    event.preventDefault();
    this.selectIndex(0);
  }

  onFocusLast(event) {
    event.preventDefault();
    this.selectIndex(this.state.results.length - 1);
  }

  onFocusPrevious(event) {
    event.preventDefault();
    const {results = [], selectedIndex} = this.state;
    let index = selectedIndex - 1;
    if (index < 0) {
      index = results.length - 1;
    }

    this.selectIndex(index);
  }

  onFocusNext(event) {
    event.preventDefault();
    // make sure menu is shown
    if (!this.state.showDropdown) {
      this.showMenu();
    }
    const {results = [], selectedIndex} = this.state;
    const index = results.length ? (selectedIndex + 1) % results.length : 0;
    this.selectIndex(index);
  }

  onPageDown(event) {
    event.preventDefault();
    const {results = [], selectedIndex, showDropdown} = this.state;
    const len = results.length;
    if (!showDropdown || !len) {
      return;
    }

    const listNode = ReactDOM.findDOMNode(this.getListRef());
    const items = [...listNode.children];
    const targetItem = items[selectedIndex === -1 ? 0 : selectedIndex];
    const nextPage = Math.min(targetItem.offsetTop + listNode.clientHeight, listNode.scrollHeight + listNode.clientHeight);
    const index = items.indexOf(targetItem) + 1;
    const item = items.slice(index).find(item => item.offsetTop + item.offsetHeight > nextPage);

    if (item) {
      this.selectIndex(items.indexOf(item), true);
    } else {
      this.onFocusLast(event);
    }
  }

  onPageUp(event) {
    event.preventDefault();
    const {results = [], selectedIndex, showDropdown} = this.state;
    const len = results.length;
    if (!showDropdown || !len) {
      return;
    }

    const listNode = ReactDOM.findDOMNode(this.getListRef());
    const items = [...listNode.children];
    const targetItem = items[selectedIndex === -1 ? 0 : selectedIndex];
    const nextPage = Math.max(targetItem.offsetTop + targetItem.offsetHeight - listNode.clientHeight, 0);
    const index = items.indexOf(targetItem);
    const item = items.slice(0, index).reverse().find(item => item.offsetTop < nextPage);

    if (item) {
      this.selectIndex(items.indexOf(item));
    } else {
      this.onFocusFirst(event);
    }
  }

  onMouseEnter(index) {
    this.selectIndex(index);
  }

  onAltArrowDown(event) {
    event.preventDefault();
    if (!this.state.showDropdown) {
      this.showMenu();
    }
  }

  onAltArrowUp(event) {
    event.preventDefault();
    if (this.state.showDropdown) {
      this.hideMenu();
    }
  }

  onTab(event) {
    this.onSelectFocused(event);
  }

  selectIndex(selectedIndex, alignToStart) {
    this.setState({selectedIndex}, () => {
      if (this.menu && !isNaN(selectedIndex) && selectedIndex !== -1) {
        // make sure that the selected item scrolls into view
        const list = ReactDOM.findDOMNode(this.getListRef());
        if (list) {
          const node = list.children[selectedIndex];
          if (node) {
            scrollToDOMNode(node, list, alignToStart);
          }
        }
      }
    });
  }

  toggleMenu() {
    if (this.state.showDropdown) {
      this.hideMenu();
    } else {
      this.showMenu();
    }
  }

  async showMenu() {
    this.setState({showDropdown: true, selectedIndex: -1});
    let results = await this.getCompletions(this.state.value) || [];

    // Reset the selected index based on the value
    let selectedIndex = results.findIndex(result => getLabel(result) === this.state.value);
    if (selectedIndex !== -1) {
      this.setState({selectedIndex});
    }

    if (this.props.onMenuShow) {
      this.props.onMenuShow();
    }
  }

  hideMenu() {
    this.setState({showDropdown: false, selectedIndex: -1});
    if (this.props.onMenuHide) {
      this.props.onMenuHide();
    }
  }

  getActiveDescendantId() {
    const {selectedIndex, showDropdown, results = []} = this.state;
    return showDropdown && results.length > 0 && selectedIndex !== -1 ? this.optionIdPrefix + OPTION + selectedIndex : undefined;
  }

  getListboxId() {
    const {showDropdown, results = []} = this.state;
    return showDropdown && results.length > 0 ? this.autocompleteId + LISTBOX : undefined;
  }

  getListRef() {
    return this.menu && this.menu.getListRef();
  }

  render() {
    const {id, className} = this.props;
    const {isFocused, results = [], selectedIndex, showDropdown, value} = this.state;
    const children = React.Children.toArray(this.props.children);
    const trigger = children.find(c => c.props.autocompleteInput) || children[0];
    const menuShown = showDropdown && results.length > 0;
    const inputId = id || trigger.props.id || this.autocompleteId;

    return (
      <div
        className={classNames('react-spectrum-Autocomplete', {'is-focused': isFocused}, className)}
        ref={w => this.wrapper = w}
        role="combobox"
        aria-controls={this.getListboxId()}
        aria-expanded={menuShown}
        aria-haspopup="true"
        aria-owns={this.getListboxId()}>
        {children.map(child => {
          if (child === trigger) {
            return React.cloneElement(child, {
              value: value,
              onChange: chain(child.props.onChange, this.onChange),
              onKeyDown: chain(child.props.onKeyDown, interpretKeyboardEvent.bind(this)),
              onFocus: chain(child.props.onFocus, this.onFocus),
              onBlur: chain(child.props.onBlur, this.onBlur),
              id: inputId,
              autoComplete: 'off',
              role: 'textbox',
              'aria-activedescendant': this.getActiveDescendantId(),
              'aria-autocomplete': 'list',
              'aria-controls': this.getListboxId()
            });
          }

          return child;
        })}

        <Overlay target={this.wrapper} show={menuShown} placement="bottom left" role="presentation">
          <Menu
            onSelect={this.onSelect}
            style={{width: this.state.width + 'px'}}
            role="listbox"
            ref={m => this.menu = m}
            id={this.getListboxId()}>
            {results.map((result, i) => {
              let label = getLabel(result);
              return (
                <MenuItem
                  role="option"
                  id={this.optionIdPrefix + OPTION + i}
                  tabIndex={selectedIndex === i ? 0 : -1}
                  key={`item-${i}`}
                  value={result}
                  icon={result.icon}
                  focused={selectedIndex === i}
                  selected={label === value}
                  onMouseEnter={this.onMouseEnter.bind(this, i)}
                  onMouseDown={e => e.preventDefault()}>
                  {label}
                </MenuItem>
              );
            })}
          </Menu>
        </Overlay>
      </div>
    );
  }
}
