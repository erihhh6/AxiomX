# AxiomX - Scientists Collaboration Platform

A web platform for scientists to share research, upload publications, and collaborate through forum discussions.

## Features

- **User Authentication**: Register, login, profile management
- **Publication Sharing**: Upload and download PDF publications with metadata
- **Discussion Forums**: Create topics and participate in scientific discussions
- **Responsive Design**: Built with Bootstrap 5 for a clean, modern interface

## Technology Stack

- **Backend**: Django 5.1
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **File Storage**: Local file system (with easy migration to Azure Blob Storage)
- **Deployment**: Prepared for Docker and Azure deployment

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd scientist_collab
```

### 2. Set up a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create MySQL database

```sql
CREATE DATABASE scientist_collab CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 5. Configure environment variables

Create a `.env` file in the project root with:

```
DEBUG=True
SECRET_KEY=your_secret_key_here
DB_NAME=scientist_collab
DB_USER=root
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
```

### 6. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create admin user

```bash
python manage.py createsuperuser
```

### 8. Create forums

1. Log in to the admin panel at http://localhost:8000/admin/
2. Create a few initial forum categories

### 9. Run the development server

```bash
python manage.py runserver
```

Access the site at http://localhost:8000

## Preparing for Production

### For Docker Deployment

1. Build the Docker image:
```bash
docker build -t scientist-collab .
```

2. Run the container:
```bash
docker run -p 8000:8000 scientist-collab
```

### For Azure Deployment

1. Create Azure App Service
2. Configure MySQL database on Azure
3. Update environment variables
4. Deploy using GitHub Actions or Azure DevOps

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Badge System Installation

We've implemented a badge system that rewards users for their activity on the platform. Here's how to set it up:

1. Apply database migrations to create the badge tables:
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```

2. Load the initial badges data:
   ```
   python manage.py loaddata fixtures/badges.json
   ```

3. Update the badge progress for all users:
   ```
   python manage.py update_badges
   ```

## Available Badges

The system comes with the following pre-configured badges:

1. **Publication Master** - Published at least 5 scientific publications on the platform
2. **Liked Author** - Received at least 10 likes on your publications
3. **Favorite Creator** - Your publications were added to favorites 5 times
4. **Active Replier** - Posted at least 15 replies in forum discussions
5. **Popular Scientist** - Reached 10 followers on your profile
6. **Complete Profile** - Filled out all profile information fields
7. **Diverse Scientist** - Participated in discussions across all forums

## Badge System Features

- Users can see their badge progress on their profile page
- Badge progress is updated when users perform relevant actions
- Users can "equip" a badge to display it prominently on their profile
- Each badge shows progress toward completion (e.g., "40% - Need 3 more likes")
- Badges appear grayed out until earned

## Theme Toggle Guide

The platform supports both light and dark modes. The toggle switch is in the navbar.
To style new components for dark mode, add CSS rules in this format:

```css
body[data-theme="dark"] .your-component,
html[data-theme="dark"] .your-component {
    background-color: #1e1e1e;
    color: #e9ecef;
}
``` 