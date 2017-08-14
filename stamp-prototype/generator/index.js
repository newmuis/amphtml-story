'use strict';

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp').sync;
const Handlebars = require('handlebars');

if (process.argv.length < 4) {
  console.err('invalid arguments. Usage: "node index.js inputDir outputDir"');
  process.exit(1);
}

const sourceDir = process.argv[2];
const destDir = process.argv[3];

class SampleGenerator {

  constructor(srcDir, destDir) {
    this.srcDir = srcDir;
    this.destDir = destDir;
  }

  generate() {
    const stamps = this.readStamps();
    this.generateIndexFile(stamps);
  }

  generateIndexFile(stamps) {
    const indexTemplate = this.compileTemplate('index.html');
    const indexFile = indexTemplate(stamps);
    this.write('index.html', indexFile);
  }

  compileTemplate(name) {
    const templatePath = path.join(__dirname, 'templates', name);
    const templateString = fs.readFileSync(templatePath, 'utf8');
    return Handlebars.compile(templateString);
  }

  write(fileName, content) {
    mkdirp(this.destDir);
    fs.writeFileSync(path.join(this.destDir, fileName), content);
  }

  readStamps() {
    return fs.readdirSync(this.srcDir)
      .filter(file => file.endsWith('.html'))
      .map(file => {
      const filePath = path.join(sourceDir, file);
      const contents = fs.readFileSync(filePath, 'utf8')
      const $ = cheerio.load(contents);
      const title = $('amp-story-page:first-child h1').text();
      return {
        id: slugify(title),
        title: title,
        description: $('amp-story-page:first-child p').text(),
        path: file,
        content: contents,
      }
    }).reverse();
  }
}



new SampleGenerator(sourceDir, destDir).generate();
