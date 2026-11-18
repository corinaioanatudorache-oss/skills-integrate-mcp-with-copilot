# Mergington High School Activities API

A simple FastAPI application that lets students view activities and teachers manage signups.

## Features

- View all available extracurricular activities
- Teacher-only activity signup and participant removal
- Teacher login with credentials supplied through environment variables

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Configure teacher credentials in the environment (do not commit credentials):

   ```sh
   export TEACHER_USERNAME="teacher"
   export TEACHER_PASSWORD="use-a-unique-secret"
   ```

   The activity list remains publicly viewable when credentials are not configured, but teacher login and roster changes are unavailable.

3. From the repository root, run the application:

   ```
   uvicorn src.app:app --reload
   ```

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                      | Start a teacher session                                             |
| GET    | `/auth/session`                                                    | Check the current teacher session                                   |
| POST   | `/auth/logout`                                                     | End the current teacher session                                     |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up a student (teacher session required)                        |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove a student (teacher session required)                     |

Teacher credentials are read from `TEACHER_USERNAME` and `TEACHER_PASSWORD`; they are not stored in the repository. Successful logins receive an HTTP-only, same-site session cookie that expires after eight hours. Activity viewing is public, while signup and unregister requests require a valid teacher session.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
