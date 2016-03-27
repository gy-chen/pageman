import helper
import model
import pagination
from flask import Flask
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for
app = Flask(__name__)

FORMAT_DATE = '%Y-%m-%d'

@app.context_processor
def inject_formats():
    return dict(FORMAT_DATE=FORMAT_DATE)

@app.route('/', defaults={'page': 1})
@app.route('/page<int:page>')
def pageman(page):
    em = model.EntriesManager()
    total_rows = em.count_entries()
    # TODO add pagination
    pagi = pagination.Pagination(total_rows, current_page=page)
    entries = em.get_entries(pagi.get_from_rows(), pagi.get_to_rows() + 1)
    return render_template('pageman.html',
                           entries=entries,
                           pagination=pagi,
                           helper=helper)

# TODO implement this method as a web API
@app.route('/pageman/write', methods=['POST'])
def pageman_write():
    'Write a new entry'
    title = request.form['title']
    content = request.form['content']
    # TODO check input values
    em = model.EntriesManager()
    new_entry = model.Entry()
    new_entry.set_title(title)
    new_entry.set_content(content)
    em.save_entry(new_entry)
    # TODO remove me later
    return redirect(url_for('pageman'))

if __name__ == '__main__':
    app.debug = True
    app.run()
