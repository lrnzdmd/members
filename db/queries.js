const pool = require('./pool.js');

async function newUser(username, fullname, password) {
    await pool.query("INSERT INTO users (username, fullname, password, memberstatus) VALUES ($1,$2,$3,'User');",[username, fullname, password]);
}

async function newMessage(title, authorid, message) {
    title = title === '' ? 'untitled' : title;
   
    await pool.query ("INSERT INTO messages (userid, title, message, date) VALUES ($1,$2,$3,NOW());",[authorid, title, message]);
}

async function editMessage(msgid, newTitle, newText) {
    newText += ' edited by Admin.';
    await pool.query("UPDATE messages SET title = $1, message = $2 WHERE id = $3;",[newTitle,  newText, msgid])
}

async function getAllMessages() {
    const { rows } = await pool.query("SELECT messages.id, users.fullname, messages.title, messages.message, messages.date FROM messages JOIN users ON messages.userid = users.id");
    return rows;
}

async function getMessageById(msgid) {
    const { rows } = await pool.query("SELECT messages.id, users.fullname, messages.title, messages.message, messages.date FROM messages JOIN users ON messages.userid = users.id WHERE messages.id = $1",[msgid]);
    return rows[0];
}

async function deleteMessage(msgid) {
    await pool.query("DELETE FROM messages WHERE id = $1;",[msgid]);
}

async function userUpgrade(userid) {
    await pool.query("UPDATE users SET memberstatus = 'Member' WHERE id = $1;", [userid]);
}

module.exports = {
    newUser,
    newMessage,
    editMessage,
    getMessageById,
    getAllMessages,
    deleteMessage,
    userUpgrade

}