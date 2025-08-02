import { User } from '../../models/User';

export class getUserByUsername {
  public static async getOrCreateUser(username: string) {
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }
    return user;
  }
}
