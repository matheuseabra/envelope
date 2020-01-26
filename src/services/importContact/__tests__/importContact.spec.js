const mongoose = require('mongoose');
const { Readable } = require('stream');
const Contact = require('../../../schema/Contact');
const Tag = require('../../../schema/Tag');
const ImportContacts = require('../index');

describe('ImportContacts', () => {
  beforeAll(async () => {
    if (!process.env.MONGO_URL) {
      throw new Error('MongoDB server not initialized');
    }

    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Contact.deleteMany({});
    await Tag.deleteMany({});
  });

  it('should import new contacts', async () => {
    const contactsFileStream = Readable.from([
      'matheus@email.com\n',
      'lucas@email.com\n',
      'rodrigo@email.com\n',
    ]);

    const importContacts = new ImportContacts();

    await importContacts.run(contactsFileStream, ['Students', 'Class A']);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual([
      expect.objectContaining({ title: 'Students' }),
      expect.objectContaining({ title: 'Class A' }),
    ]);

    const createdTagsIds = createdTags.map(tag => tag._id);

    const createdContacts = await Contact.find({}).lean();

    expect(createdContacts).toEqual([
      expect.objectContaining({
        email: 'matheus@email.com',
        tags: createdTagsIds,
      }),
      expect.objectContaining({
        email: 'lucas@email.com',
        tags: createdTagsIds,
      }),
      expect.objectContaining({
        email: 'rodrigo@email.com',
        tags: createdTagsIds,
      }),
    ]);
  });

  it('should not create tags that already exist', async () => {
    const contactsFileStream = Readable.from([
      'matheus@email.com\n',
      'lucas@email.com\n',
      'rodrigo@email.com\n',
    ]);

    const importContacts = new ImportContacts();

    await Tag.create({ title: 'Students' });

    await importContacts.run(contactsFileStream, ['Students', 'Class A']);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual([
      expect.objectContaining({ title: 'Students' }),
      expect.objectContaining({ title: 'Class A' }),
    ]);
  });

  it('should not recreate contacts that already exists', async () => {
    const contactsFileStream = Readable.from([
      'matheus@email.com.br\n',
      'lucas@email.com\n',
      'rodrigo@email.com\n',
    ]);

    const importContacts = new ImportContacts();

    const tag = await Tag.create({ title: 'Students' });
    await Contact.create({ email: 'matheus@email.com.br', tags: [tag._id] });

    await importContacts.run(contactsFileStream, ['Class A']);

    const contacts = await Contact.find({
      email: 'matheus@email.com.br',
    })
      .populate('tags')
      .lean();

    expect(contacts.length).toBe(1);
    expect(contacts[0].tags).toEqual([
      expect.objectContaining({ title: 'Students' }),
    ]);
  });
});
