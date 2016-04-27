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
  onFormWrite: function() {
    this._cancel_entries();
    this._cancel_pagination();
    this._request_entries();
    this._request_pagination();
  },
  onPaginationButtonClick: function(href, pagination_url, event) {
    event.preventDefault();
    this._entries_url = href;
    this._pagination_url = pagination_url;
    this._cancel_entries();
    this._request_entries();
    this._cancel_pagination();
    this._request_pagination();
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
  render: function() {
    return (
      <div>
        <Pageman.WriteForm
          write_action_url={ this.props.write_action_url }
          onFormWrite={ this.onFormWrite }  />
        <Pageman.Entries entries={ this.state.entries } />
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
    $.post(this.props.write_action_url,
      {
        title: this._input_title.value,
        content: this._input_content.value()
      },
      function(data, textStatus, jqXHR) {
        this._input_title.value = '';
        this._input_content.value('');
        this.props.onFormWrite();
      }.bind(this)
    )
  },
  componentDidMount: function() {
    this._input_content = new SimpleMDE();
  },
  render: function() {
    return (
      <form action={ this.props.write_action_url } method="POST">
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
                          date={entry.date}
                          title={entry.title}
                          content={entry.content} />);
        });
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
  * date
  * title
  * content
*/
Pageman.Entry = React.createClass({
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
