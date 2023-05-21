var express = require('express');
var router = express.Router();
var mysql=require('mysql2');
require('dotenv').config();

const db=mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: 'hallBooking',
  

})

db.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});



function updateRoomStatus(roomNo) {
  const query = `
    UPDATE room_status
    SET room_status = 'available'
    WHERE roomNo = '${roomNo}'
  `;

  db.query(query, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Room status updated for roomNo ${roomNo}`);
    }
  });
}

function checkExpiredBookings() {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12:false});

  const currentDate = new Date().toISOString().split('T')[0];

  const query = `
    SELECT roomNo
    FROM booked_details
    WHERE end_time < '${currentTime}'  
    AND status = 'new'
    AND dateOFBooking='${currentDate}'
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error retrieving expired bookings:', error);
    } else {
      results.forEach((booking) => {
        const roomNo = booking.roomNo;
        updateRoomStatus(roomNo);

        // Mark the booking as old
        const updateQuery = `
          UPDATE booked_details
          SET status = 'old bookings'
          WHERE roomNo = '${roomNo}' 
          AND end_time < '${currentTime}'
          AND dateOFBooking='${currentDate}'
          `;
        db.query(updateQuery, (error, result) => {
          if (error) {
            console.error(error);
          } else {
            console.log(`Booking marked as old for roomNo ${roomNo}`);
          }
        });
      });
       console.log(currentTime);
      console.log(`Processed ${results.length} expired bookings.`);
    }
  });
}

setInterval(checkExpiredBookings,  1*60*1000); // Run every 1 minute




/* GET home page. */
//getting all rooms
router.get('/allRoom', function(req, res, next) {
  console.log('working')
  const query="SELECT roomNo, customer_name,"
  + "DATE_FORMAT(dateOFBooking, '%Y-%m-%d') AS dateOfBooking"+
  ", start_time, end_time, status  FROM booked_details   ORDER BY roomNo; ";


 
 
 
  
  db.query(query,((err,result)=>{
    if(err){
      console.log(err);
    }
    else{
      res.send(result);
    }
  }))
  
});

//getting all customers
router.get('/allCustomer', function(req, res, next) {
  
  const query="SELECT customer_name,roomNo,DATE_FORMAT(dateOFBooking, '%Y-%m-%d') AS dateOfBooking"+
  ", start_time, end_time  FROM booked_details   ORDER BY customer_name; ";
   
  db.query(query,((err,result)=>{
    if(err){
      console.log(err);
    }
    else{
      res.send(result);
    }
  }))
  
});

//creating rooms with specific aminities..
router.post('/createRoom',function(req,res,next){
 
  const data = req.body;
  console.log(data);
  db.query('INSERT INTO room SET ?', data, (error, results) => {
    if (error) {
      console.error(error);
    } else {
      res.status(200).send({message:"room created successfully"})
    }
  });
})

// booking a room
router.post("/bookRoom", function (req, res) {
  const roomNo = req.body.roomNo;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const dateOFBooking = req.body.dateOFBooking;

  // Check if the end time is after the start time
  if (end_time <= start_time) {
    res.status(400).send("Invalid booking time. End time should be after start time.");
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  if (start_time < currentTime && req.body.dateOFBooking <= currentDate) {
    // The start time or date is in the past
    res.status(400).send("Booking in the past is not allowed");
    return;
  }

  db.query("SELECT * FROM room WHERE roomNo = ?", [roomNo], function (err, room) {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred");
      return;
    }

    if (room.length === 0) {
      // The room doesn't exist
      res.status(404).send("The room doesn't exist");
      return;
    }

    db.query(
    
      "SELECT * FROM booked_details WHERE roomNo = ? AND start_time <= ? AND end_time >= ? AND dateOFBooking=?  AND end_time > start_time",
      [roomNo, end_time, start_time,dateOFBooking],
      function (err, result) {
        if (err) {
          console.error(err);
          res.status(500).send("An error occurred");
          return;
        }

        if (result.length > 0) {
          // The room is already booked for the requested time period
          res.status(409).send("The room is already booked for the requested time period");
          return;
        }

        db.query(
          "UPDATE room_status SET room_status = 'booked' WHERE roomNo = ?",
          [roomNo],
          function (err, result) {
            if (err) {
              console.error(err);
              res.status(500).send("An error occurred");
              return;
            }

            const data = req.body;
            const query = `
              INSERT INTO booked_details (roomID, customer_name, dateOFBooking, start_time, end_time, roomNo)
              VALUES (
                (SELECT roomID FROM room WHERE roomNo = '${data.roomNo}'),
                '${data.customer_name}',
                '${data.dateOFBooking}',
                '${data.start_time}',
                '${data.end_time}',
                '${data.roomNo}'
              );
            `;
            db.query(query, data, (error, results) => {
              if (error) {
                console.error(error);
              } else {
                res.status(200).send({ message: "Booking created successfully" });
              }
            });
          }
        );
      }
    );
  });
});




module.exports = router;

