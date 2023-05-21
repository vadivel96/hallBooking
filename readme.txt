 Hall Booking task:-
 1)endpoint - "/createRoom" for creating room with specified details
 eg:{
   roomSeat:3,
   aminities:"freeWifi,Ac,geyser,tv,parkingfacility,dailyHouseKeping,cctvs",
   price:100,
   roomNo:"08"
}
2)endpoint -"/allRoom" for getting all rooms with booked details

3) endpoint -"/allCustomer" for getting all Customer with booked details

4)endpoint -"/bookRoom" for booking rooms 

eg: for postman usage
{
   "customer_name":"xxx",
   "dateOFBooking":"2023-05-28",
   "start_time":"08:08:00",
   "end_time":"22:00:00",
   "roomNo":"02"
 
}