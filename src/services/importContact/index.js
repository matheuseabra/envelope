const csvParse = require('csv-parse');
const Tag = require('../../schema/Tag');
const Contact = require('../../schema/Contact');

class ImportContacts {
  async run(contactsFileStream, tags) {
    const parsers = csvParse({
      delimiter: ';',
    });

    const parseCSV = contactsFileStream.pipe(parsers);

    const existentTags = await Tag.find({
      title: {
        $in: tags,
      },
    });

    const existentTagsTitles = existentTags.map(tag => tag.title);
    const existentTagsIds = existentTags.map(tag => tag._id);

    const newTagsData = tags
      .filter(tag => !existentTagsTitles.includes(tag))
      .map(tag => ({ title: tag }));

    const createdTags = await Tag.create(newTagsData);
    const createdTagsIds = createdTags.map(tag => tag._id);

    const tagsIds = [...existentTagsIds, ...createdTagsIds];

    parseCSV.on('data', async line => {
      const [email] = line;

      await Contact.findOneAndUpdate(
        { email },
        { $addToSet: { tags: tagsIds } },
        { upsert: true },
      );
    });

    await new Promise(resolve => parseCSV.on('end', resolve));
  }
}

module.exports = ImportContacts;
