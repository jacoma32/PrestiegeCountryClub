let save;
let pending = Promise.resolve();

export async function loadPlayerSave() {
  const { playerSaveRequest, auth } = await import('./member-auth.js?v=username1');
  const { data, error } = await auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user?.user_metadata?.username) return null;

  const read = () => playerSaveRequest('load', user.id);
  let current = await read();
  save = {
    get state() { return current.state; },
    update(change) {
      const request = pending.then(async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          current = await read();
          const state = structuredClone(current.state);
          const result = change(state);
          try {
            current = await playerSaveRequest('save', user.id, { state, revision: current.revision });
            return result;
          } catch (error) {
            if (error.status !== 409) throw error;
          }
        }
        throw Error('Your save changed in another tab. Try again.');
      });
      pending = request.catch(() => {});
      return request;
    },
  };
  return { username: user.user_metadata.username };
}

export function playerSave() {
  return save;
}
