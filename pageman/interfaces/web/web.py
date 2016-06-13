from pageman.core import model
from pageman.core import settings
from pageman.tools import helper
from pageman.tools import pagination
from flask import Flask
from flask import Response
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for
from flask import jsonify
app = Flask(__name__)

FORMAT_DATE = '%Y-%m-%d'

@app.context_processor
def inject_formats():
    return dict(FORMAT_DATE=FORMAT_DATE)

@app.route('/', defaults={'page': 1})
@app.route('/page<int:page>')
def pageman(page):
    return render_template('pageman.html')

@app.route('/pageman/entries', defaults={'page': 1})
@app.route('/pageman/entries/page<int:page>')
def pageman_entries(page):
    'Get json format entries.'
    em = model.EntriesManager(settings.MONGO_URL)
    total_rows = em.count_entries()
    pagi = pagination.Pagination(total_rows, current_page=page)
    entries = em.get_entries(pagi.get_from_rows(), pagi.get_to_rows() + 1)
    output_entries = []
    for entry in entries:
        output_entries.append({
            'id': entry['_id'].__str__(),
            'date': entry['date'].strftime(FORMAT_DATE),
            'title': entry['title'],
            'content_html': helper.markdown_to_html(entry['content']),
            'content': entry['content']
        })
    return jsonify(entries=output_entries)

@app.route('/pageman/write', methods=['POST'])
def pageman_write():
    '''Web API of writing a new entry

    Method: POST
    Input values:
      * title: required
      * content: required
    Output values:
      * errors: errors codes
    Responses:
      * 200: success
      * 400: Has errors in input values
    '''
    title = request.form['title']
    content = request.form['content']
    new_entry = model.Entry()
    new_entry.set_title(title)
    new_entry.set_content(content)
    new_entry.set_date_as_current_date()
    # check input values
    errors = new_entry.get_errors()
    # no errors
    if errors == 0:
        em = model.EntriesManager(settings.MONGO_URL)
        em.save_entry(new_entry)
    response = jsonify(errors=errors)
    response.status_code = 400 if errors > 0 else 200
    return response

@app.route('/pageman/edit', methods=['POST'])
def pageman_edit():
    """Web API for editing an entry

    Method: POST
    Input values:
      * id: required
      * title: required
      * content: required
    Output values:
      * errors: errors codes
    Responses:
      * 200: success
      * 400: Has errors in input values
    """
    id_ = request.form['id']
    title = request.form['title']
    content = request.form['content']
    entry = model.Entry()
    entry.set_id(id_)
    entry.set_title(title)
    entry.set_content(content)
    entry.set_date_as_current_date()
    # check input values
    errors = entry.get_errors()
    # no errors
    # TODO encapsulate errors into a class
    if errors == 0:
        em = model.EntriesManager(settings.MONGO_URL)
        em.save_entry(entry)
    response = jsonify(errors=errors)
    response.status_code = 400 if errors > 0 else 200
    return response

@app.route('/pageman/delete', methods=['POST'])
def pageman_delete():
    '''Web API for deleting an entry

    Method: POST
    Input values:
      * id: required
    Output values:
      * errors: errors codes
    Responses:
      * 200: success
      * 400: Has errors on input values
    '''
    # TODO refactor this error checking mechanic
    errors = 0
    try:
        id_ = request.form['id']
    except KeyError:
        errors += model.Entry.ERROR_NO_ID
    em = model.EntriesManager(settings.MONGO_URL)
    em.delete_entry(id_)
    response = jsonify(errors=errors)
    response.status_code = 400 if errors > 0 else 200
    return response

@app.route('/pageman/get_pagination', defaults={'page': 1})
@app.route('/pageman/get_pagination/page<int:page>')
def pageman_get_pagination(page):
    em = model.EntriesManager(settings.MONGO_URL)
    total_rows = em.count_entries()
    pagi = pagination.Pagination(total_rows, current_page=page)
    hrefs = []
    def _generate_href(href, pagination_url, name, display_as_href):
        return {
            'href': href,
            'pagination_url': pagination_url,
            'name': name,
            'display_as_href': display_as_href
        }
    # Prev link
    if pagi.get_current_page() != 1:
        hrefs.append(_generate_href(
            url_for('pageman_entries', page=pagi.get_current_page() - 1),
            url_for('pageman_get_pagination', page=pagi.get_current_page() - 1),
            'Prev',
            True
        ))
    # page links
    for p in range(pagi.get_pagination_from_page(), pagi.get_pagination_to_page() + 1):
        hrefs.append(_generate_href(
            url_for('pageman_entries', page=p),
            url_for('pageman_get_pagination', page=p),
            p,
            p != pagi.get_current_page())
        )
    # Next link
    if pagi.get_current_page() != pagi.get_total_pages():
        hrefs.append(_generate_href(
            url_for('pageman_entries', page=pagi.get_current_page() + 1),
            url_for('pageman_get_pagination', page=pagi.get_current_page() + 1),
            'Next',
            True
        ))
    return jsonify(hrefs=hrefs)

if __name__ == '__main__':
    app.debug = True
    app.run()
