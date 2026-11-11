// Expects Authorization: Bearer <client-id>
function auth(clients) {
  return (req, res, next) => {
    const header = req.get('Authorization') || '';
    const match = header.match(/^Bearer\s+(\S+)$/i);
    const clientId = match && match[1];

    if (!clientId || !Object.hasOwn(clients, clientId)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    req.clientId = clientId;
    req.clientConfig = clients[clientId];
    next();
  };
}

module.exports = auth;
