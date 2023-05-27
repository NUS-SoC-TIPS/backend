// This is the minimal information needed by the frontend to
// render the user card element.
export interface UserBase {
  name: string;
  githubUsername: string;
  profileUrl: string;
  photoUrl: string;
}

export const makeUserBase = (user: {
  name: string;
  githubUsername: string;
  profileUrl: string;
  photoUrl: string;
}): UserBase => {
  return {
    name: user.name,
    githubUsername: user.githubUsername,
    profileUrl: user.profileUrl,
    photoUrl: user.photoUrl,
  };
};
