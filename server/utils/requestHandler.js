exports.unauthorised = unauthorised;
exports.unauthenticated = unauthenticated;
exports.loggedIn = loggedIn;
exports.generic = generic;
exports.error = error;
exports.success = success;

function unauthorised(res, message) {
  message = message || 'unauthorised';
  res.status(401);
  res.send({success: false, message: message});
}

function unauthenticated(res, message) {
  message = message || 'unauthenticated';
  res.status(403);
  res.send({success: false, message: message});
}

function loggedIn(res, user, message) {
  message = message || 'Bine ai venit';
  res.send({success: true, message: message, user: user});
}

function generic(res, data, message) {
  message = message || '';
  res.send({success: true, message: message, data: data});
}

function error(res, message, err) {
  console.log(err);
  message = message || 'A apărut o eroare';
  res.status(403);
  res.send({success: false, message: message, err: err});
}

function success(res, message) {
  message = message || 'Succes!!';
  res.send({success: true, message: message});
}
