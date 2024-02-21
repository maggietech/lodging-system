// Importing necessary modules from the 'azle' library and 'uuid' library
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from "uuid";

// Defining record types for different entities
type House = Record<{
  id: string;
  name: string;
  owner: Principal;
  created_date: nat64;
  updated_at: Opt<nat64>;
}>;

type Room = Record<{
  id: string;
  house_id: string;
  room_number: string;
  is_booked: boolean;
  price: string;
  created_date: nat64;
  updated_at: Opt<nat64>;
}>;

type Guest = Record<{
  id: string;
  name: string;
  created_date: nat64;
}>;

type Reservation = Record<{
  id: string;
  room_id: string;
  guest_id: string;
  check_in_date: nat64;
  check_out_date: nat64;
  created_date: nat64;
}>;

type Payment = Record<{
  id: string;
  reservation_id: string;
  amount: string;
  created_date: nat64;
  updated_at: Opt<nat64>;
}>;

type RoomPayload = Record<{
  house_id: string;
  room_number: string;
  price: string;
}>;

type ReservationPayload = Record<{
  room_id: string;
  guest_id: string;
  check_in_date: nat64;
  check_out_date: nat64;
}>;

type PaymentPayload = Record<{
  reservation_id: string;
  amount: string;
}>;

type PaymentResponse = Record<{
  msg: string;
  amount: number;
}>;

// Creating instances of StableBTreeMap for each entity type
const houseStorage = new StableBTreeMap<string, House>(0, 44, 512);
const roomStorage = new StableBTreeMap<string, Room>(1, 44, 512);
const guestStorage = new StableBTreeMap<string, Guest>(2, 44, 512);
const reservationStorage = new StableBTreeMap<string, Reservation>(3, 44, 512);
const paymentStorage = new StableBTreeMap<string, Payment>(4, 44, 512);

// Initialization of houseStorage
$update;
export function initHouse(name: string): string {
  if (!houseStorage.isEmpty()) {
    return `House has already been initialized`;
  }
  const house = {
    id: uuidv4(),
    name: name,
    owner: ic.caller(),
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  houseStorage.insert(house.id, house);
  return house.id;
}

$update;
// Function to add a new room
export function addRoom(payload: RoomPayload): string {
  const room = {
    id: uuidv4(),
    house_id: payload.house_id,
    room_number: payload.room_number,
    is_booked: false,
    price: payload.price,
    created_date: ic.time(),
    updated_at: Opt.None,
  };
  roomStorage.insert(room.id, room);
  return room.id;
}

// Function to check if person making the request is the house owner
function isHouseOwner(caller: string): boolean {
    const house = houseStorage.values()[0];
    return house.owner.toText() != caller;
}

$query;
// Function to check out and pay for a reservation
export function checkOutAndPay(id: string, amount: string): PaymentResponse {
  return match(reservationStorage.get(id), {
    Some: (reservation) => {
      const room = match(roomStorage.get(reservation.room_id), {
        Some: (room) => room,
        None: () => ({} as unknown as Room),
      });
      if (room) {
        room.is_booked = false;
        roomStorage.insert(room.id, room);
      }
      const payment = {
        id: uuidv4(),
        reservation_id: id,
        amount: amount,
        created_date: ic.time(),
        updated_at: Opt.None,
      };
      paymentStorage.insert(payment.id, payment);
      return {
        msg: `Payment processed successfully`,
        amount: parseFloat(amount),
      };
    },
    None: () => {
      return {
        msg: `Reservation not found. Please check your reservation ID`,
        amount: 0,
      };
    },
  });
}

$update;
// Function to update information for a room
export function updateRoom(id: string, payload: RoomPayload): string {
  if (isHouseOwner(ic.caller().toText())) {
    return "Action reserved for the house owner";
  }
  const room = match(roomStorage.get(id), {
    Some: (room) => room,
    None: () => ({} as unknown as Room),
  });
  if (room) {
    room.room_number = payload.room_number;
    room.price = payload.price;
    room.updated_at = Opt.Some(ic.time());
    roomStorage.insert(room.id, room);
  }
  return room.id;
}

$update;
// Function to delete a room
export function deleteRoom(id: string): string {
  if (isHouseOwner(ic.caller().toText())) {
    return "Action reserved for the house owner";
  }
  roomStorage.remove(id);
  return `Room of ID: ${id} removed successfully`;
}

$update;
// Function to add a new guest
export function addGuest(name: string): string {
  const guest = {
    id: uuidv4(),
    name: name,
    created_date: ic.time(),
  };
  guestStorage.insert(guest.id, guest);
  return guest.id;
}

$update;
// Function to update guest information
export function updateGuest(id: string, name: string): string {
  const guest = match(guestStorage.get(id), {
    Some: (guest) => guest,
    None: () => ({} as unknown as Guest),
  });
  if (guest) {
    guest.name = name;
    guestStorage.insert(guest.id, guest);
  }
  return guest.id;
}

$update;
// Function to delete a guest
export function deleteGuest(id: string): string {
  guestStorage.remove(id);
  return `Guest of ID: ${id} removed successfully`;
}

$update;
// Function to get reservations by guest
export function getReservationsByGuest(guestId: string): Result<Vec<Reservation>, string> {
  const reservations = reservationStorage.values().filter((reservation) => reservation.guest_id === guestId);
  if (reservations.length === 0) {
    return Result.Err("No reservations found for this guest");
  }
  return Result.Ok(reservations);
}

$update;
// Function to get payments by reservation
export function getPaymentsByReservation(reservationId: string): Result<Vec<Payment>, string> {
  const payments = paymentStorage.values().filter((payment) => payment.reservation_id === reservationId);
  if (payments.length === 0) {
    return Result.Err("No payments found for this reservation");
  }
  return Result.Ok(payments);
}

$update;
// Function to update payment information
export function updatePayment(id: string, amount: string): string {
  const payment = match(paymentStorage.get(id), {
    Some: (payment) => payment,
    None: () => ({} as unknown as Payment),
  });
  if (payment) {
    payment.amount = amount;
    payment.updated_at = Opt.Some(ic.time());
    paymentStorage.insert(payment.id, payment);
  }
  return payment.id;
}

$update;
// Function to delete a payment
export function deletePayment(id: string): string {
  paymentStorage.remove(id);
  return `Payment of ID: ${id} removed successfully`;
}

$update;
// Function to add a new reservation
export function addReservation(payload: ReservationPayload): string {
  const reservation = {
    id: uuidv4(),
    room_id: payload.room_id,
    guest_id: payload.guest_id,
    check_in_date: payload.check_in_date,
    check_out_date: payload.check_out_date,
    created_date: ic.time(),
  };
  reservationStorage.insert(reservation.id, reservation);

  const room = match(roomStorage.get(payload.room_id), {
    Some: (room) => room,
    None: () => ({} as unknown as Room),
  });
  if (room) {
    room.is_booked = true;
    roomStorage.insert(room.id, room);
  }
  return `Your Reservation ID: ${reservation.id}`;
}

$update;
// Function to update reservation information
export function updateReservation(id: string, payload: ReservationPayload): string {
  const reservation = match(reservationStorage.get(id), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (reservation) {
    // Check if the room is already booked for the updated reservation dates
    const conflictingReservation = reservationStorage.values().find((r) =>
      r.room_id === payload.room_id &&
      r.id !== id &&
      (
        (payload.check_in_date >= r.check_in_date && payload.check_in_date < r.check_out_date) ||
        (payload.check_out_date > r.check_in_date && payload.check_out_date <= r.check_out_date) ||
        (payload.check_in_date <= r.check_in_date && payload.check_out_date >= r.check_out_date)
      )
    );

    if (conflictingReservation) {
      return `Cannot update reservation. The room is already booked for the selected dates.`;
    }

    // Update the reservation information
    reservation.room_id = payload.room_id;
    reservation.guest_id = payload.guest_id;
    reservation.check_in_date = payload.check_in_date;
    reservation.check_out_date = payload.check_out_date;
    reservationStorage.insert(reservation.id, reservation);

    // Update the room booking status
    const room = match(roomStorage.get(payload.room_id), {
      Some: (room) => room,
      None: () => ({} as unknown as Room),
    });
    if (room) {
      room.is_booked = true;
      roomStorage.insert(room.id, room);
    }

    return `Reservation updated successfully`;
  } else {
    return `Reservation not found`;
  }
}

$update;
// Function to delete a reservation
export function deleteReservation(id: string): string {
  const reservation = match(reservationStorage.get(id), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (reservation) {
    reservationStorage.remove(id);
    
    // Update the room booking status
    const room = match(roomStorage.get(reservation.room_id), {
      Some: (room) => room,
      None: () => ({} as unknown as Room),
    });
    if (room) {
      room.is_booked = false;
      roomStorage.insert(room.id, room);
    }

    return `Reservation of ID: ${id} removed successfully`;
  } else {
    return `Reservation not found`;
  }
}

$update;
// Function to get reservations by room
export function getReservationsByRoom(roomId: string): Result<Vec<Reservation>, string> {
  const reservations = reservationStorage.values().filter((reservation) => reservation.room_id === roomId);
  if (reservations.length === 0) {
    return Result.Err("No reservations found for this room");
  }
  return Result.Ok(reservations);
}

$update;
// Function to update reservation check-in date
export function updateReservationCheckInDate(id: string, checkInDate: nat64): string {
  const reservation = match(reservationStorage.get(id), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (reservation) {
    reservation.check_in_date = checkInDate;
    reservationStorage.insert(reservation.id, reservation);
    return `Check-in date for reservation ID ${id} updated successfully`;
  } else {
    return `Reservation not found`;
  }
}

$update;
// Function to update reservation check-out date
export function updateReservationCheckOutDate(id: string, checkOutDate: nat64): string {
  const reservation = match(reservationStorage.get(id), {
    Some: (reservation) => reservation,
    None: () => ({} as unknown as Reservation),
  });
  if (reservation) {
    reservation.check_out_date = checkOutDate;
    reservationStorage.insert(reservation.id, reservation);
    return `Check-out date for reservation ID ${id} updated successfully`;
  } else {
    return `Reservation not found`;
  }
}

$query;
// Function to check room availability for a given date range
export function checkRoomAvailability(roomId: string, checkInDate: nat64, checkOutDate: nat64): boolean {
  const reservations = reservationStorage.values().filter((reservation) =>
    reservation.room_id === roomId &&
    (
      (checkInDate >= reservation.check_in_date && checkInDate < reservation.check_out_date) ||
      (checkOutDate > reservation.check_in_date && checkOutDate <= reservation.check_out_date) ||
      (checkInDate <= reservation.check_in_date && checkOutDate >= reservation.check_out_date)
    )
  );
  return reservations.length === 0;
}

// Mocking the 'crypto' object for testing purposes
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
