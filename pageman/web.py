import helper
import model
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

@app.route('/')
def pageman():
    em = model.EntriesManager()
    # TODO add pagination
    entries = em.get_entries()
    return render_template('pageman.html',
                           entries=entries,
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
