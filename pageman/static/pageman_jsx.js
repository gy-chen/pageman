var Pageman = React.createClass({
  getInitialState: function() {
    this._pagination_url = this.props.pagination_url;
    this._entries_url = this.props.entries_url;
    return {
      entries: null,
      pagination_hrefs: null,
    };
  },
  componentDidMount: function() {
    this._request_entries();
    this._request_pagination();
  },
  componentWillUnmount: function() {
    this._cancel_entries();
    this._cancel_pagination();
  },
  onFormWrite: function(title, content) {
    this._write_new_entry(title, content);
    this._refresh_entries();
  },
  onPaginationButtonClick: function(href, pagination_url, event) {
    event.preventDefault();
    this._entries_url = href;
    this._pagination_url = pagination_url;
    this._refresh_entries();
  },
  onEntryDelete: function(id) {
    this._request_delete_entry(id);
    this._refresh_entries();
  },
  _request_delete_entry: function(id) {
    this.delete_entry_request = $.post(this.props.delete_action_url,
      {id: id}
    );
  },
  _request_entries: function() {
    this.setState({
      entries: null
    });
    this.entries_request =  $.get(this._entries_url,
      function(data) {
        this.setState({
          entries: data['entries']
        });
      }.bind(this));
  },
  _cancel_entries: function() {
    if (this.entries_request) {
      this.entries_request.abort();
    }
  },
  _write_new_entry: function(title, content) {
    $.post(this.props.write_action_url,
      {
        title: title,
        content: content
      }
    );
  },
  _request_pagination: function() {
    this.pagination_request = $.get(this._pagination_url,
      function(result) {
        this.setState({'pagination_hrefs': result.hrefs});
      }.bind(this)
    );
  },
  _cancel_pagination: function() {
    if (this.pagination_request) {
      this.pagination_request.abort();
    }
  },
  _refresh_entries: function() {
    this._cancel_pagination();
    this._cancel_entries();
    this._request_pagination();
    this._request_entries();
  },
  render: function() {
    return (
      <div>
        <Pageman.WriteForm
          style={ {'marginBottom': '10px'} }
          write_action_url={ this.props.write_action_url }
          onFormWrite={ this.onFormWrite }  />
        <Pageman.Entries
          entries={ this.state.entries }
          onEntryDelete={ this.onEntryDelete } />
        <Pageman.Pagination
          onPaginationButtonClick={ this.onPaginationButtonClick }
          hrefs={ this.state.pagination_hrefs } />
      </div>
    );
  }
});

/*
The props this class needs:
  * write_action_url
*/
Pageman.WriteForm = React.createClass({
  onWriteButtonClick: function(event) {
    event.preventDefault();
    this.props.onFormWrite(this._input_title.value, this._input_content.value());
    this._input_title.value = '';
    this._input_content.value('');
  },
  componentDidMount: function() {
    this._input_content = new SimpleMDE();
  },
  render: function() {
    return (
      <form action={ this.props.write_action_url } method="POST" { ...this.props }>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input type="text" ref={ (element) => this._input_title = element} className="form-control" name="title" id="title" />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea className="form-control" name="content" id="content"></textarea>
        </div>
        <button onClick={ this.onWriteButtonClick } type="submit" className="btn btn-primary btn-block">Write</button>
      </form>
    );
  }
});

/*
The props this class needs:
  * entries: array of entries. e.g. [{'date': '...', 'title': '...', 'content': '...'}]
  * onEntryDelete
*/
Pageman.Entries = React.createClass({
  render: function() {
      var entries = [];
      if (this.props.entries === null) {
        entries.push(<div key="0" className="well">Loading entries...</div>);
      } else {
        this.props.entries.forEach(function(entry) {
          entries.push(<Pageman.Entry
                          key={entry.id}
                          id={entry.id}
                          date={entry.date}
                          title={entry.title}
                          content={entry.content}
                          onEntryDelete={this.props.onEntryDelete} />);
        }.bind(this));
      }
      return (
        <div class="entries">
          { entries }
        </div>
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
  onEditButtonClick: function() {

  },
  onDeleteButtonClick: function(id) {
    this.props.onEntryDelete(id);
  },
  _create_inner_content_html: function(content) {
    return {
      __html: content
    };
  },
  render: function() {
    return (
      <div>
        <Pageman.EntryToolbar
          style={ {'marginBottom': '-35px', 'marginTop': '7px', 'zIndex': 44} }
          entry_id={ this.props.id }
          onEditButtonClick={ this.onEditButtonClick }
          onDeleteButtonClick={ this.onDeleteButtonClick } />
        <Pageman.EntryDisplay
          date={ this.props.date }
          title={ this.props.title }
          content={ this.props.content }
        />
      </div>
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
  render: function() {
    return (
      <div className="btn-group" {...this.props}>
        <button
          className="btn btn-default"
          onClick={ this.props.onEditButtonClick }>
          <i className="glyphicon glyphicon-edit"></i>
        </button>
        <button
          className="btn btn-danger"
          onClick={ this.props.onDeleteButtonClick.bind(null, this.props.entry_id) }>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
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
  _create_inner_content_html: function(content) {
    return {
      __html: content
    };
  },
  render: function() {
    return (
      <div className="entry">
        <div className="row">
          <div className="col-md-12">
            <h1><small>{ this.props.date }</small> { this.props.title }</h1>
          </div>
        </div>
        <div className="row">
          <div
            className="col-md-12"
            dangerouslySetInnerHTML={ this._create_inner_content_html(this.props.content) }>
          </div>
        </div>
      </div>
    );
  }
});

/*
 The props this component expected:
 * onPaginationButtonClick: callback function that accept page parameter
 * hrefs: the source of pagination data
*/
Pageman.Pagination = React.createClass({
  render: function() {
    var elements = [];
    if (this.props.hrefs !== null) {
      this.props.hrefs.forEach(function(href) {
        if (href.display_as_href) {
          elements.push(<li key={ href.name }>
            <a
              href='#'
              onClick={ this.props.onPaginationButtonClick.bind(null, href.href, href.pagination_url) }>
              { href.name }
            </a>
          </li>);
        } else {
          elements.push(<li
            key={ href.name }
            className="active"><a href="#">{ href.name }</a></li>);
        }
      }.bind(this));
    } else {
      elements.push(<div key="0" className="well"><span>Pagination is loading...</span></div>);
    }
    return (
      <ul className="pagination">
        { elements }
      </ul>
    );
  }
});

// make some variables global
window.Pageman = Pageman;
