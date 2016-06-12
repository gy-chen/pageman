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
    'Write a new entry'
    title = request.form['title']
    content = request.form['content']
    # TODO check input values
    em = model.EntriesManager(settings.MONGO_URL)
    new_entry = model.Entry()
    new_entry.set_title(title)
    new_entry.set_content(content)
    em.save_entry(new_entry)
    return Response(status=200)

@app.route('/pageman/edit', methods=['POST'])
def pageman_edit():
    id_ = request.form['id']
    title = request.form['title']
    content = request.form['content']
    em = model.EntriesManager(settings.MONGO_URL)
    em.save_entry({
        '_id': id_,
        'title': title,
        'content': content
    })
    return Response(status=200)

@app.route('/pageman/delete', methods=['POST'])
def pageman_delete():
    "Delete an entry"
    id_ = request.form['id']
    # TODO check input value
    em = model.EntriesManager(settings.MONGO_URL)
    em.delete_entry(id_)
    return Response(status=200)

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
