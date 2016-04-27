(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  onFormWrite: function () {
    this._cancel_entries();
    this._cancel_pagination();
    this._request_entries();
    this._request_pagination();
  },
  onPaginationButtonClick: function (href, pagination_url, event) {
    event.preventDefault();
    this._entries_url = href;
    this._pagination_url = pagination_url;
    this._cancel_entries();
    this._request_entries();
    this._cancel_pagination();
    this._request_pagination();
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
  render: function () {
    return React.createElement(
      'div',
      null,
      React.createElement(Pageman.WriteForm, {
        write_action_url: this.props.write_action_url,
        onFormWrite: this.onFormWrite }),
      React.createElement(Pageman.Entries, { entries: this.state.entries }),
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
    $.post(this.props.write_action_url, {
      title: this._input_title.value,
      content: this._input_content.value()
    }, function (data, textStatus, jqXHR) {
      this._input_title.value = '';
      this._input_content.value('');
      this.props.onFormWrite();
    }.bind(this));
  },
  componentDidMount: function () {
    this._input_content = new SimpleMDE();
  },
  render: function () {
    return React.createElement(
      'form',
      { action: this.props.write_action_url, method: 'POST' },
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
          date: entry.date,
          title: entry.title,
          content: entry.content }));
      });
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
  * date
  * title
  * content
*/
Pageman.Entry = React.createClass({
  displayName: 'Entry',

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
