# lodging-system
## Overview
This module facilitates managing a lodging system that includes houses, rooms, guests, reservations, payments, and guest requests. It allows operations such as initializing houses, adding rooms, making reservations, processing payments, updating room information, deleting rooms, managing guests, handling guest requests, and searching for available rooms based on various criteria.

### Entity Types
1. **House**: Represents a lodging facility with properties like ID, name, owner, address, and creation date.
2. **Room**: Represents a room within a house with properties like ID, house ID, room number, type, availability status, price, and creation date.
3. **Guest**: Represents a guest with properties like ID, name, email, phone number, and creation date.
4. **Reservation**: Represents a booking made by a guest with properties like ID, house ID, room ID, guest ID, check-in and check-out dates, and creation date.
5. **Payment**: Represents a payment made for a reservation with properties like ID, reservation ID, amount, status, and creation date.
6. **GuestRequest**: Represents a request submitted by a guest with properties like ID, guest ID, details, status, and creation date.

### Functions
1. **initHouse**: Initializes a house with a unique ID, name, owner, address, and creation date.
2. **getAvailableRooms**: Retrieves available rooms in a house based on the provided house ID.
3. **addRoom**: Adds a new room to a house with specified details.
4. **makeReservation**: Makes a reservation for a room with specified details and marks the room as booked.
5. **checkOutAndPay**: Checks out from a reservation, marks the room as available, processes payment, and returns a payment response.
6. **updateRoom**: Updates information for a room specified by its ID.
7. **deleteRoom**: Deletes a room specified by its ID.
8. **addGuest**: Adds a new guest with provided name, email, and phone number.
9. **updateGuest**: Updates information for a guest specified by their ID.
10. **makePayment**: Makes a payment for a reservation specified by its ID.
11. **getPaymentHistory**: Retrieves payment history for a reservation specified by its ID.
12. **searchAvailableRoomsByDateRange**: Searches available rooms in a house based on a specified date range.
13. **searchAvailableRoomsByType**: Searches available rooms in a house based on a specified room type.
14. **searchAvailableRoomsByPriceRange**: Searches available rooms in a house based on a specified price range.
15. **submitGuestRequest**: Submits a guest request with details provided by the guest.
16. **getGuestRequestsByGuestId**: Retrieves guest requests associated with a guest specified by their ID.
17. **updateGuestRequestStatus**: Updates the status of a guest request specified by its ID.

### Usage
1. Initialize the house using `initHouse` function.
2. Add rooms to the house using `addRoom`.
3. Make reservations using `makeReservation`.
4. Process payments for reservations using `checkOutAndPay` or `makePayment`.
5. Update room information using `updateRoom`.
6. Delete rooms using `deleteRoom`.
7. Manage guests using `addGuest` and `updateGuest`.
8. Handle guest requests using `submitGuestRequest`, `getGuestRequestsByGuestId`, and `updateGuestRequestStatus`.
9. Search available rooms based on different criteria using corresponding search functions.

### Note
This module requires the `azle` library for interaction with the IC (Internet Computer) environment and the `uuid` library for generating unique identifiers.
