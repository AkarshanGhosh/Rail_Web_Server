# Rail Web Server

This project serves as the backend for a railway management system, providing APIs to manage train, coach, and division-related data. It is designed to streamline operations by offering endpoints for data retrieval, updates, and notifications.

## Features

- **Division Management**:
  - Add, update, delete, and fetch division details.
- **Coach Management**:
  - Fetch detailed information about coaches, including latitude, longitude, and status.
- **Train Management**:
  - Manage train details like chain status, temperature, humidity, and errors.
  - Send notifications when specific conditions are met (e.g., chain pulled).
- **User Management**:
  - Handles user notifications via email.

## Technologies Used

- **Node.js**: Runtime environment for building the server.
- **Express.js**: Web framework for handling routes and middleware.
- **MongoDB**: Database for storing railway-related data.
- **Mongoose**: ODM for interacting with MongoDB.
- **Nodemailer**: For sending email notifications.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AkarshanGhosh/Rail_Web_Server.git
