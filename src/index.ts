// Importing necessary modules from the 'azle' library and 'uuid' library
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from "uuid";

// Defining record types for different entities

// Record type for a House entity
type House = Record<{
  id: string; // Unique identifier for the house
  name: string; // Name of the house
  owner: Principal; // Owner of the house
  address: string; // Address of the house
  created_date: nat64; // Date when the house was created
  updated_at: Opt<nat64>; // Date when the house was last updated (optional)
}>;

// Record type for a Room entity
type Room = Record<{
  id: string; // Unique identifier for the room
  house_id: string; // Identifier of the house to which the room belongs
  room_number: string; // Room number
  type: string; // Type of room (e.g., single, double, suite)
  is_booked: boolean; // Indicates if the room is booked or not
  price: string; // Price of the room
  created_date: nat64; // Date when the room was created
  updated_at: Opt<nat64>; // Date when the room was last updated (optional)
}>;

// Record type for a Guest entity
type Guest = Record<{
  id: string; // Unique identifier for the guest
  name: string; // Name of the guest
  email: string; // Email address of the guest
  phone: string; // Phone number of the guest
  created_date: nat64; // Date when the guest was created
}>;

// Record type for a Reservation entity
type Reservation = Record<{
  id: string; // Unique identifier for the reservation
  house_id: string; // Identifier of the house for which the reservation is made
  room_id: string; // Identifier of the room for which the reservation is made
  guest_id: string; // Identifier of the guest making the reservation
  check_in_date: nat64; // Date of check-in for the reservation
  check_out_date: nat64; // Date of check-out for the reservation
  created_date: nat64; // Date when the reservation was created
}>;

// Record type for a Payment entity
type Payment = Record<{
  id: string; // Unique identifier for the payment
  reservation_id: string; // Identifier of the reservation for which the payment is made
  amount: string; // Amount of the payment
  status: string; // Status of the payment (e.g., Paid, Pending)
  created_date: nat64; // Date when the payment was created
  updated_at: Opt<nat64>; // Date when the payment was last updated (optional)
}>;

// Record type for the payload of a Room
type RoomPayload = Record<{
  house_id: string; // Identifier of the house to which the room belongs
  room_number: string; // Room number
  type: string; // Type of room (e.g., single, double, suite)
  price: string; // Price of the room
}>;

// Record type for the payload of a Reservation
type ReservationPayload = Record<{
  house_id: string; // Identifier of the house for which the reservation is made
  room_id: string; // Identifier of the room for which the reservation is made
  guest_id: string; // Identifier of the guest making the reservation
  check_in_date: nat64; // Date of check-in for the reservation
  check_out_date: nat64; // Date of check-out for the reservation
}>;

// Record type for the payload of a Payment
type PaymentPayload = Record<{
  reservation_id: string; // Identifier of the reservation for which the payment is made
  amount: string; // Amount of the payment
}>;

// Record type for the response of a Payment
type PaymentResponse = Record<{
  msg: string; // Message indicating the result of the payment operation
  amount: number; // Amount of the payment
}>;

// Creating instances of StableBTreeMap for each entity type
const houseStorage = new StableBTreeMap<string, House>(0, 44, 512);
const roomStorage = new StableBTreeMap<string, Room>(1, 44, 512);
const guestStorage = new StableBTreeMap<string, Guest>(2, 44, 512);
const reservationStorage = new StableBTreeMap<string, Reservation>(3, 44, 512);
const paymentStorage = new StableBTreeMap<string, Payment>(4, 44, 512);

// Initialization of houseStorage
$update;
export function initHouse(name: string, address: string): string {
  if (!houseStorage.isEmpty()) {
    return `House has already been initialized`;
  }
  const house = {
    id: uuidv4(),
    name: name,
    owner: ic.caller(),
    address: address,
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  houseStorage.insert(house.id, house);
  return house.id;
}

$query;
// Function to get available rooms in a house
export function getAvailableRooms(houseId: string): Result<Vec<Room>, string> {
  const availableRooms = roomStorage.values().filter((room) => !room.is_booked && room.house_id == houseId);
  if (availableRooms.length == 0) {
    return Result.Err("No available rooms in this house currently");
  }
  return Result.Ok(availableRooms);
}

// Other functions for adding rooms, making reservations, checking out and paying, updating rooms, deleting rooms, etc. would be implemented here.

// Function to add a new room to a house
$update;
export function addRoom(payload: RoomPayload): string {
  const room = {
    id: uuidv4(),
    house_id: payload.house_id,
    room_number: payload.room_number,
    type: payload.type,
    is_booked: false,
    price: payload.price,
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  roomStorage.insert(room.id, room);
  return room.id;
}

// Function to make a reservation for a room
$update;
export function makeReservation(payload: ReservationPayload): string {
  const reservation = {
    id: uuidv4(),
    house_id: payload.house_id,
    room_id: payload.room_id,
    guest_id: payload.guest_id,
    check_in_date: payload.check_in_date,
    check_out_date: payload.check_out_date,
    created_date: ic.time(),
  };
  reservationStorage.insert(reservation.id, reservation);

  // Mark the room as booked
  const room = match(roomStorage.get(payload.room_id), {
    Some: (room) => room,
    None: () => ({} as unknown as Room),
  });
  if (room) {
    room.is_booked = true;
    roomStorage.insert(room.id, room);
  }
  return `Reservation ID: ${reservation.id} made successfully`;
}

// Function to check out and pay for a reservation
$update;
export function checkOutAndPay(reservationId: string, amount: string): PaymentResponse {
  const reservation = match(reservationStorage.get(reservationId), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (!reservation.id) {
    return {
      msg: "Reservation not found",
      amount: 0,
    };
  }

  // Mark the room as available
  const room = match(roomStorage.get(reservation.room_id), {
    Some: (room) => room,
    None: () => ({} as unknown as Room),
  });
  if (room) {
    room.is_booked = false;
    roomStorage.insert(room.id, room);
  }

  // Process payment
  const payment = {
    id: uuidv4(),
    reservation_id: reservationId,
    amount: amount,
    status: "Paid",
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  paymentStorage.insert(payment.id, payment);

  return {
    msg: `Payment processed successfully for Reservation ID: ${reservationId}`,
    amount: parseFloat(amount),
  };
}

// Function to update information for a room
$update;
export function updateRoom(roomId: string, payload: RoomPayload): string {
  const room = match(roomStorage.get(roomId), {
    Some: (room) => room,
    None: () => ({} as unknown as Room),
  });
  if (room) {
    room.room_number = payload.room_number;
    room.type = payload.type;
    room.price = payload.price;
    room.updated_at = Opt.Some(ic.time());
    roomStorage.insert(room.id, room);
  }
  return room.id;
}

// Function to delete a room
$update;
export function deleteRoom(roomId: string): string {
  roomStorage.remove(roomId);
  return `Room with ID: ${roomId} deleted successfully`;
}

// Function to add a new guest
$update;
export function addGuest(name: string, email: string, phone: string): string {
  const guest = {
    id: uuidv4(),
    name: name,
    email: email,
    phone: phone,
    created_date: ic.time(),
  };
  guestStorage.insert(guest.id, guest);
  return guest.id;
}

// Function to update information for a guest
$update;
export function updateGuest(guestId: string, name: string, email: string, phone: string): string {
  const guest = match(guestStorage.get(guestId), {
    Some: (guest) => guest,
    None: () => ({} as unknown as Guest),
  });
  if (guest) {
    guest.name = name;
    guest.email = email;
    guest.phone = phone;
    guestStorage.insert(guest.id, guest);
  }
  return guest.id;
}

// Function to make a payment for a reservation
$update;
export function makePayment(reservationId: string, amount: string): PaymentResponse {
  const reservation = match(reservationStorage.get(reservationId), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (!reservation.id) {
    return {
      msg: "Reservation not found",
      amount: 0,
    };
  }

  const payment = {
    id: uuidv4(),
    reservation_id: reservationId,
    amount: amount,
    status: "Paid",
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  paymentStorage.insert(payment.id, payment);

  return {
    msg: `Payment processed successfully for Reservation ID: ${reservationId}`,
    amount: parseFloat(amount),
  };
}

// Function to retrieve payment history for a reservation
$query;
export function getPaymentHistory(reservationId: string): Result<Vec<Payment>, string> {
  const payments = paymentStorage.values().filter((payment) => payment.reservation_id == reservationId);
  if (payments.length === 0) {
    return Result.Err("No payments found for this reservation");
  }
  return Result.Ok(payments);
}

// Function to search available rooms in a house by date range
$query;
export function searchAvailableRoomsByDateRange(houseId: string, startDate: nat64, endDate: nat64): Result<Vec<Room>, string> {
  const availableRooms = roomStorage.values().filter((room) =>
    room.house_id === houseId &&
    !room.is_booked &&
    room.created_date >= startDate &&
    room.created_date <= endDate
  );
  if (availableRooms.length === 0) {
    return Result.Err("No available rooms in this house for the specified date range");
  }
  return Result.Ok(availableRooms);
}

// Function to search available rooms in a house by room type
$query;
export function searchAvailableRoomsByType(houseId: string, roomType: string): Result<Vec<Room>, string> {
  const availableRooms = roomStorage.values().filter((room) =>
    room.house_id === houseId &&
    !room.is_booked &&
    room.type === roomType
  );
  if (availableRooms.length === 0) {
    return Result.Err("No available rooms in this house with the specified type");
  }
  return Result.Ok(availableRooms);
}

// Function to search available rooms in a house by price range
$query;
export function searchAvailableRoomsByPriceRange(houseId: string, minPrice: string, maxPrice: string): Result<Vec<Room>, string> {
  const availableRooms = roomStorage.values().filter((room) =>
    room.house_id === houseId &&
    !room.is_booked &&
    parseFloat(room.price) >= parseFloat(minPrice) &&
    parseFloat(room.price) <= parseFloat(maxPrice)
  );
  if (availableRooms.length === 0) {
    return Result.Err("No available rooms in this house within the specified price range");
  }
  return Result.Ok(availableRooms);
}

// Record type for a GuestRequest entity
type GuestRequest = Record<{
    id: string; // Unique identifier for the guest request
    guest_id: string; // Identifier of the guest making the request
    details: string; // Details of the request
    status: string; // Status of the request (e.g., pending, fulfilled)
    created_date: nat64; // Date when the request was created
  }>;
  
  // Creating an instance of StableBTreeMap for guest requests
  const guestRequestStorage = new StableBTreeMap<string, GuestRequest>(5, 44, 512);
  
  // Function to submit a guest request
  $update;
  export function submitGuestRequest(guestId: string, details: string): string {
    const guestRequest = {
      id: uuidv4(),
      guest_id: guestId,
      details: details,
      status: "Pending", // New requests are initially set to pending status
      created_date: ic.time(),
    };
    guestRequestStorage.insert(guestRequest.id, guestRequest);
    return guestRequest.id;
  }
  
  // Function to get guest requests by guest ID
  $query;
  export function getGuestRequestsByGuestId(guestId: string): Result<Vec<GuestRequest>, string> {
    const guestRequests = guestRequestStorage.values().filter((request) => request.guest_id === guestId);
    if (guestRequests.length === 0) {
      return Result.Err("No requests found for this guest");
    }
    return Result.Ok(guestRequests);
  }
  
  // Function to update the status of a guest request
  $update;
  export function updateGuestRequestStatus(requestId: string, status: string): string {
    const guestRequest = match(guestRequestStorage.get(requestId), {
      Some: (request) => request,
      None: () => ({} as unknown as GuestRequest),
    });
    if (guestRequest) {
      guestRequest.status = status;
      guestRequestStorage.insert(guestRequest.id, guestRequest);
    }
    return guestRequest.id;
  }
  
// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
