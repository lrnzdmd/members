const pool = require('./pool.js');

async function newUser(username, fullname, password) {
    await pool.query("INSERT INTO users (username, fullname, password, memberstatus) VALUES ($1,$2,$3,'User');",[username, fullname, password]);
}

async function newMessage(title, authorid, message) {
    title = title === '' ? 'untitled' : title;
   
    await pool.query ("INSERT INTO messages (userid, title, message, date) VALUES ($1,$2,$3,NOW());",[authorid, title, message]);
}

async function getAllMessages() {
    const { rows } = await pool.query("SELECT messages.id, users.fullname, messages.title, messages.message, messages.date FROM messages JOIN users ON messages.userid = users.id");
    return rows;
}

module.exports = {
    newUser,
    newMessage,
    getAllMessages

}