const path = require('path');
const fs = require('fs');
const collector = require('../src/collector');

const sample = fs.readFileSync(path.join(__dirname, 'sample.mk'), 'utf8');
const sampleNestStructures = JSON.parse(fs.readFileSync(path.join(__dirname, 'sampleNestStructures.json')));

test('test collect', () => {
    const nestStructures = collector.collect(sample);
    expect(nestStructures).toEqual(sampleNestStructures);
});

test('test level', () => {
    const nestStructures = collector.collect(sample);

    expect(nestStructures[0].getLevel()).toEqual(0);
    expect(nestStructures[1].getLevel()).toEqual(1);
    expect(nestStructures[2].getLevel()).toEqual(3);
})

test('test title', () => {
    const nestStructures = collector.collect(sample);

    expect(nestStructures[0].getTitle()).toEqual("title 1");
    expect(nestStructures[1].getTitle()).toEqual("list item 1");
    expect(nestStructures[2].getTitle()).toEqual("sub list item 1");
})