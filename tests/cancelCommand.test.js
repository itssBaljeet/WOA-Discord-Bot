const { Fighter, Fight } = require('../src/models');
const cancelCommand = require('../src/discord/commands/ranking/cancel');
const logError = require('../src/utils/logError');

jest.mock('../src/models/index');
jest.mock('../src/utils/logError');

describe('cancelCommand', () => {
  let interaction;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    interaction = {
      options: {
        getInteger: jest.fn().mockReturnValue(1),
      },
      user: {
        id: 'user1',
      },
      member: {
        roles: {
          cache: {
            has: jest.fn().mockReturnValue(false),
          },
        },
      },
      channelId: 'channel1',
      reply: jest.fn(),
      commandName: 'cancel',
      guild: {
        channels: {
          cache: {
            get: jest.fn().mockReturnValue({
              name: 'correct-channel',
            }),
          },
        },
      },
    };

    process.env.MAIN_TEXT_CHANNEL_ID = 'channel1';
    process.env.ADMIN_ROLE_ID = 'adminRoleId';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reply with the correct channel message if used in the wrong channel', async () => {
    interaction.channelId = 'wrongChannel';

    await cancelCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Please use this command in the correct channel: #correct-channel',
      ephemeral: true,
    });
  });

  it('should reply if the fight does not exist', async () => {
    Fight.findByPk.mockResolvedValue(null);

    await cancelCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'The fight does not exist.', ephemeral: true });
  });

  it('should reply if the user is not an admin or a participant in the fight', async () => {
    const fight = { fighter1Id: 'user2', fighter2Id: 'user3' };
    Fight.findByPk.mockResolvedValue(fight);
    Fighter.findByPk.mockResolvedValue({ id: 'user1' });

    await cancelCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'You do not have permission to cancel this fight.', ephemeral: true });
  });

  it('should cancel the fight and reset challenge statuses', async () => {
    const fight = { id: 1, fighter1Id: 'user1', fighter2Id: 'user2' };
    Fight.findByPk.mockResolvedValue(fight);
    Fighter.findByPk.mockResolvedValue({ id: 'user1' });

    // Ensure the user is recognized as an admin or participant
    interaction.member.roles.cache.has = jest.fn().mockReturnValue(true); // User has admin role

    Fighter.update.mockResolvedValue([1]); // Mock successful update
    Fight.update.mockResolvedValue([1]); // Mock successful update

    await cancelCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Fight ID 1 has been cancelled.', ephemeral: true });
  });

  it('should log an error and reply if an error occurs', async () => {
    const error = new Error('Test error');
    Fight.findByPk.mockRejectedValue(error);

    await cancelCommand.execute(interaction);

    expect(logError).toHaveBeenCalledWith(error, interaction.commandName, interaction.user.username);
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'An error occurred while trying to cancel the fight.', ephemeral: true });
  });
});
