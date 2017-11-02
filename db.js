let mysql = require('mysql');
let config = require('./config/config');
let dateFormat = require('dateformat');

let con = mysql.createConnection({
    host: "localhost",
    user: config.user,
    password: config.password,
    database: config.database
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    let user = `create table if not exists user(
                          user_id int primary key auto_increment,
                          username varchar(255) not null unique,
                          password varchar(255) not null
                      )`;

    let profile = `create table if not exists profile(
                          user_id int primary key auto_increment,
                          firstname varchar(255) not null,
                          lastname varchar(255),
                          dob DATE not null,
                          occupation varchar(255),
                          address_zip varchar(255)
                      )`;

    let address = `create table if not exists address(
                          address_zip int primary key,
                          address_state varchar(255) not null,
                          address_city varchar(255),
                          address_district varchar(255)
                      )`;

    let dobTrigger = `CREATE TRIGGER check_dob
                        BEFORE INSERT ON profile
                      FOR EACH ROW
                        BEGIN
                             DECLARE msg VARCHAR(32) DEFAULT "";
                             IF(NEW.dob < date '1950-01-01' or 
                               NEW.dob > CURDATE())
                             THEN
                                set msg = concat('Date of birth INVALID');
                                signal sqlstate '45000' set message_text = msg;
                             END IF;    
                         END`;

    let status = `create table if not exists status(
                          status_id int primary key auto_increment,
                          text varchar(255),
                          date varchar(255),
                          type varchar(255),
                          user_id int not null,
                          FOREIGN KEY (user_id) REFERENCES user(user_id)
                      )`;

    let friends = `create table if not exists friends(
                          user_id int not null,
                          pending boolean default true,
                          friend_id int not null,
                          FOREIGN KEY (user_id) REFERENCES user(user_id),
                          FOREIGN KEY (friend_id) REFERENCES user(user_id)
                      )`;

    let profile_view = `create or replace view profile_view as
                          select
                            user_id,
                            firstname,
                            lastname,
                            dob,
                            occupation,
                            address_zip,
                            TIMESTAMPDIFF(YEAR,dob,CURDATE()) AS age
                           from profile
                      `;

    let status_view = `create or replace view status_view as
                          select 
                            status_id,
                            firstname,
                            lastname,
                            text,
                            date,
                            type,
                            status.user_id
                          from profile,status where status.user_id = profile.user_id
                      `;

    let friends_view = `create or replace view friends_view as 
                        select
                            user_id,
                            friend_id,
                            pending,
                            (select firstname from profile_view where profile_view.user_id=friends.friend_id) as firstname,
                            (select lastname from profile_view where profile_view.user_id=friends.friend_id) as lastname,
                            (select dob from profile_view where profile_view.user_id=friends.friend_id) as dob,
                            (select age from profile_view where profile_view.user_id=friends.friend_id) as age,
                            (select occupation from profile_view where profile_view.user_id=friends.friend_id) as occupation
                        from friends                        
                      `;

    let friends_viewHelp = `create or replace view friends_viewHelp as 
                        select
                            user_id,
                            friend_id,
                            pending,
                            (select firstname from profile_view where profile_view.user_id=friends.user_id) as firstname,
                            (select lastname from profile_view where profile_view.user_id=friends.user_id) as lastname,
                            (select dob from profile_view where profile_view.user_id=friends.user_id) as dob,
                            (select age from profile_view where profile_view.user_id=friends.user_id) as age,
                            (select occupation from profile_view where profile_view.user_id=friends.user_id) as occupation
                        from friends                        
                      `;

    con.query(user, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(profile, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(status, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(friends, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(profile_view, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(status_view, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(dobTrigger, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(friends_view, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(friends_viewHelp, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    con.query(address, function(err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });
});

function findUser(username, callback) {
    let results = {
        found: "",
        id: "",
        username: "",
        password: ""
    };
    con.query('select * from user where username = "'+username+'"',function (err, user) {
        if(err) return callback(err);
        if(user.length>0) {
            results.found = true;
            results.id = user[0].user_id;
            results.username = user[0].username;
            results.password = user[0].password;
            callback(null, results);
        }
        else {
            results.found = false;
            callback(null, results);
        }
    });
}

function findStatus(callback) {
    let results = {
        found: "",
        status : ""
    };
    con.query('select * from status_view',function (err, status) {
        if(err) return callback(err);
        if(status.length>0) {
            results.found = true;
            results.status = status
            callback(null, results);
        }
        else {
            results.found = false;
            callback(null, results);
        }
    });
}

function findStatusByUserId(id, callback) {
    let results = {
        found: "",
        status : ""
    };
    con.query('select * from status where user_id = "'+id+'"',function (err, status) {
        if(err) return callback(err);
        if(status.length>0) {
            results.found = true;
            results.status = status
            callback(null, results);
        }
        else {
            results.found = false;
            callback(null, results);
        }
    });
}

function findById(id, callback) {
    let results = {
        found: "",
        id: "",
        username: "",
        password: ""
    };
    con.query('select * from user where user_id = "'+id+'"',function (err, user) {
        if(err) return callback(err);
        if(user.length>0) {
            results.found = true;
            results.id = user[0].user_id;
            results.username = user[0].username;
            results.password = user[0].password;
            callback(null, results);
        }
        else {
            results.found = false;
            callback(null, results);
        }
    });
}

function findProfileById(id, callback) {
    let results = {
        found: "",
        id: "",
        firstname: "",
        lastname: "",
        dob: "",
        occupation: "",
        age : "",
        district : "",
        city : "",
        state : "",
        zip : ""
    };
    con.query('select * from profile_view,address where profile_view.address_zip=address.address_zip and user_id = "'+id+'"',function (err, user) {
        if(err) return callback(err);
        if(user.length>0) {
            results.found = true;
            results.id = user[0].user_id;
            results.firstname = user[0].firstname;
            results.lastname = user[0].lastname;
            results.dob = dateFormat(user[0].dob, "fullDate");
            results.occupation = user[0].occupation;
            results.age = user[0].age;
            results.district = user[0].address_district;
            results.city = user[0].address_city;
            results.state = user[0].address_state;
            results.zip = user[0].address_zip;
            callback(null, results);
        }
        else {
            results.found = false;
            callback(null, results);
        }
    });
}

function addStatus(text, type, id, callback) {
    con.query('insert into status(text, type,date,user_id) values("'+text+'","'+type+'",DATE_FORMAT(NOW(), "%Y-%m-%d"),"'+id+'")', function (err) {
        if(err) callback(err);
        else
            callback();
    });
}

function findAllUsers(callback) {
    con.query('select * from profile_view', function (err, results) {
        if(err) return callback(err);
        for(let i=0;i<results.length;i++){
            results[i].dob = dateFormat(results[i].dob, "fullDate");
        }
        callback(null,results);
    });
}

function findFriends(id, callback) {
    con.query('select * from friends_view where user_id='+id, function (err, results) {
        if(err) return callback(err);
        for(let i=0;i<results.length;i++){
            results[i].dob = dateFormat(results[i].dob, "fullDate");
        }
        callback(null,results);
    });
}

function findFriendsHelp(id, callback) {
    con.query('select * from friends_viewHelp where friend_id='+id, function (err, results) {
        if(err) return callback(err);
        for(let i=0;i<results.length;i++){
            results[i].dob = dateFormat(results[i].dob, "fullDate");
        }
        callback(null,results);
    });
}

function sendRequest(user, friend, callback) {
    con.query('insert into friends(user_id,friend_id) values("'+user+'","'+friend+'")',function (err) {
        if(err) return callback(err);
        callback(null);
    });
}

function acceptRequest(user, friend, callback) {
    con.query('update friends set pending=false where user_id='+user+' and friend_id='+friend,function (err) {
        if(err) return callback(err);
        callback(null);
    });
}

function findAcceptedFriends(id, callback) {
    con.query('select * from friends_view where user_id='+id+' and pending=false', function (err, results) {
        if(err) return callback(err);
        for(let i=0;i<results.length;i++){
            results[i].dob = dateFormat(results[i].dob, "fullDate");
        }
        callback(null,results);
    });
}

module.exports = {con, findUser, findById, findProfileById, findStatus, findStatusByUserId, addStatus, findAllUsers, findFriends, findFriendsHelp, sendRequest, acceptRequest, findAcceptedFriends};



