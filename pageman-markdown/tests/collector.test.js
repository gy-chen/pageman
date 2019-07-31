const path = require('path');
const fs = require('fs');
const collector = require('../src/collector');

const sample = fs.readFileSync(path.join(__dirname, 'sample.mk'), 'utf8');
const sampleNestStructures = JSON.parse(fs.readFileSync(path.join(__dirname, 'sampleNestStructures.json')));

test('test collect', () => {
    const nextStructures = collector.collect(sample);
    expect(nextStructures).toEqual(sampleNestStructures);
});