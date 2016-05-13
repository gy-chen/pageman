(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var Pageman = React.createClass({
  displayName: 'Pageman',

  getInitialState: function () {
    this._pagination_url = this.props.pagination_url;
    this._entries_url = this.props.entries_url;
    return {
      entries: null,
      pagination_hrefs: null
    };
  },
  componentDidMount: function () {
    this._request_entries();
    this._request_pagination();
  },
  componentWillUnmount: function () {
    this._cancel_entries();
    this._cancel_pagination();
  },
  onFormWrite: function (title, content) {
    this._write_new_entry(title, content);
    this._refresh_entries();
  },
  onPaginationButtonClick: function (href, pagination_url, event) {
    event.preventDefault();
    this._entries_url = href;
    this._pagination_url = pagination_url;
    this._refresh_entries();
  },
  onEntryDelete: function (id) {
    this._request_delete_entry(id);
    this._refresh_entries();
  },
  _request_delete_entry: function (id) {
    this.delete_entry_request = $.post(this.props.delete_action_url, { id: id });
  },
  _request_entries: function () {
    this.setState({
      entries: null
    });
    this.entries_request = $.get(this._entries_url, function (data) {
      this.setState({
        entries: data['entries']
      });
    }.bind(this));
  },
  _cancel_entries: function () {
    if (this.entries_request) {
      this.entries_request.abort();
    }
  },
  _write_new_entry: function (title, content) {
    $.post(this.props.write_action_url, {
      title: title,
      content: content
    });
  },
  _request_pagination: function () {
    this.pagination_request = $.get(this._pagination_url, function (result) {
      this.setState({ 'pagination_hrefs': result.hrefs });
    }.bind(this));
  },
  _cancel_pagination: function () {
    if (this.pagination_request) {
      this.pagination_request.abort();
    }
  },
  _refresh_entries: function () {
    this._cancel_pagination();
    this._cancel_entries();
    this._request_pagination();
    this._request_entries();
  },
  render: function () {
    return React.createElement(
      'div',
      null,
      React.createElement(Pageman.WriteForm, {
        style: { 'marginBottom': '10px' },
        write_action_url: this.props.write_action_url,
        onFormWrite: this.onFormWrite }),
      React.createElement(Pageman.Entries, {
        entries: this.state.entries,
        onEntryDelete: this.onEntryDelete }),
      React.createElement(Pageman.Pagination, {
        onPaginationButtonClick: this.onPaginationButtonClick,
        hrefs: this.state.pagination_hrefs })
    );
  }
});

/*
The props this class needs:
  * write_action_url
*/
Pageman.WriteForm = React.createClass({
  displayName: 'WriteForm',

  onWriteButtonClick: function (event) {
    event.preventDefault();
    this.props.onFormWrite(this._input_title.value, this._input_content.value());
    this._input_title.value = '';
    this._input_content.value('');
  },
  componentDidMount: function () {
    this._input_content = new SimpleMDE();
  },
  render: function () {
    return React.createElement(
      'form',
      _extends({ action: this.props.write_action_url, method: 'POST' }, this.props),
      React.createElement(
        'div',
        { className: 'form-group' },
        React.createElement(
          'label',
          { htmlFor: 'title' },
          'Title'
        ),
        React.createElement('input', { type: 'text', ref: element => this._input_title = element, className: 'form-control', name: 'title', id: 'title' })
      ),
      React.createElement(
        'div',
        { className: 'form-group' },
        React.createElement(
          'label',
          { htmlFor: 'content' },
          'Content'
        ),
        React.createElement('textarea', { className: 'form-control', name: 'content', id: 'content' })
      ),
      React.createElement(
        'button',
        { onClick: this.onWriteButtonClick, type: 'submit', className: 'btn btn-primary btn-block' },
        'Write'
      )
    );
  }
});

/*
The props this class needs:
  * entries: array of entries. e.g. [{'date': '...', 'title': '...', 'content': '...'}]
  * onEntryDelete
*/
Pageman.Entries = React.createClass({
  displayName: 'Entries',

  render: function () {
    var entries = [];
    if (this.props.entries === null) {
      entries.push(React.createElement(
        'div',
        { key: '0', className: 'well' },
        'Loading entries...'
      ));
    } else {
      this.props.entries.forEach(function (entry) {
        entries.push(React.createElement(Pageman.Entry, {
          key: entry.id,
          id: entry.id,
          date: entry.date,
          title: entry.title,
          content: entry.content,
          onEntryDelete: this.props.onEntryDelete }));
      }.bind(this));
    }
    return React.createElement(
      'div',
      { 'class': 'entries' },
      entries
    );
  }
});

/*
The props this class needs:
  * key
  * id
  * date
  * title
  * content
  * onEntryDelete
*/
// TODO use one separate class for displaying and anthor for editing
Pageman.Entry = React.createClass({
  displayName: 'Entry',

  onEditButtonClick: function () {},
  onDeleteButtonClick: function (id) {
    this.props.onEntryDelete(id);
  },
  _create_inner_content_html: function (content) {
    return {
      __html: content
    };
  },
  render: function () {
    return React.createElement(
      'div',
      null,
      React.createElement(Pageman.EntryToolbar, {
        style: { 'marginBottom': '-35px', 'marginTop': '7px', 'zIndex': 44 },
        entry_id: this.props.id,
        onEditButtonClick: this.onEditButtonClick,
        onDeleteButtonClick: this.onDeleteButtonClick }),
      React.createElement(Pageman.EntryDisplay, {
        date: this.props.date,
        title: this.props.title,
        content: this.props.content
      })
    );
  }
});

/**
 * Toolbar for Entry.
 * Props this class needs:
 *  - entry_id
 *  - onEditButtonClick
 *  - onDeleteButtonClick
 */
Pageman.EntryToolbar = React.createClass({
  displayName: 'EntryToolbar',

  render: function () {
    return React.createElement(
      'div',
      _extends({ className: 'btn-group' }, this.props),
      React.createElement(
        'button',
        {
          className: 'btn btn-default',
          onClick: this.props.onEditButtonClick },
        React.createElement('i', { className: 'glyphicon glyphicon-edit' })
      ),
      React.createElement(
        'button',
        {
          className: 'btn btn-danger',
          onClick: this.props.onDeleteButtonClick.bind(null, this.props.entry_id) },
        React.createElement('i', { className: 'glyphicon glyphicon-remove' })
      )
    );
  }
});

/*
The props this class needs:
  * date
  * title
  * content
*/
Pageman.EntryDisplay = React.createClass({
  displayName: 'EntryDisplay',

  _create_inner_content_html: function (content) {
    return {
      __html: content
    };
  },
  render: function () {
    return React.createElement(
      'div',
      { className: 'entry' },
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement(
          'div',
          { className: 'col-md-12' },
          React.createElement(
            'h1',
            null,
            React.createElement(
              'small',
              null,
              this.props.date
            ),
            ' ',
            this.props.title
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement('div', {
          className: 'col-md-12',
          dangerouslySetInnerHTML: this._create_inner_content_html(this.props.content) })
      )
    );
  }
});

/*
 The props this component expected:
 * onPaginationButtonClick: callback function that accept page parameter
 * hrefs: the source of pagination data
*/
Pageman.Pagination = React.createClass({
  displayName: 'Pagination',

  render: function () {
    var elements = [];
    if (this.props.hrefs !== null) {
      this.props.hrefs.forEach(function (href) {
        if (href.display_as_href) {
          elements.push(React.createElement(
            'li',
            { key: href.name },
            React.createElement(
              'a',
              {
                href: '#',
                onClick: this.props.onPaginationButtonClick.bind(null, href.href, href.pagination_url) },
              href.name
            )
          ));
        } else {
          elements.push(React.createElement(
            'li',
            {
              key: href.name,
              className: 'active' },
            React.createElement(
              'a',
              { href: '#' },
              href.name
            )
          ));
        }
      }.bind(this));
    } else {
      elements.push(React.createElement(
        'div',
        { key: '0', className: 'well' },
        React.createElement(
          'span',
          null,
          'Pagination is loading...'
        )
      ));
    }
    return React.createElement(
      'ul',
      { className: 'pagination' },
      elements
    );
  }
});

// make some variables global
window.Pageman = Pageman;

},{}]},{},[1]);
