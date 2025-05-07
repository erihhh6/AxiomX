# AxiomX - Scientific Collaboration Platform

A comprehensive web platform for scientists to share research, publish papers, and collaborate through structured discussions and forums.

## Features

- **User Authentication**: Secure registration, login, and profile management
- **Publication Sharing**: Upload and download scientific publications with metadata
- **Discussion Forums**: Create topics and participate in scientific discussions
- **Responsive Design**: Built with Bootstrap 5 for a clean, modern interface
- **Badge System**: Gamification elements to reward user participation
- **Theme Toggle**: Support for both light and dark modes
- **Enhanced Security**: Comprehensive security measures to protect sensitive scientific data

## Technology Stack

- **Backend**: Django 5.1.7
- **Database**: MySQL with PyMySQL connector
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Security Features**:
  - Custom Content Security Policy implementation
  - Protection against brute force attacks (django-axes)
  - Secure password hashing (Argon2)
  - CSRF protection
  - Security headers middleware
- **File Storage**: Local file system (with migration path to cloud storage)
- **Deployment**: Prepared for Docker and Azure deployment

## Security Features

AxiomX implements multiple layers of security:

- **Content Security Policy (CSP)**: Custom middleware that adapts to the environment:
  - Development mode: Permissive settings to facilitate development
  - Production mode: Strict security settings to protect users
- **Brute Force Protection**: Limits login attempts and implements account lockout
- **Password Security**: Uses Argon2 (state-of-the-art hashing algorithm)
- **HTTPS Enforcement**: Automatic HTTPS redirection in production
- **Security Headers**: Implements recommended security headers:
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Permissions-Policy
  - Cross-Origin-Embedder-Policy
  - Cross-Origin-Opener-Policy

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

## Security Testing

AxiomX includes a comprehensive security testing script that checks:

- Content Security Policy implementation
- Security headers configuration
- CSRF protection
- Brute force attack protection

### Running Security Tests

```bash
python security_test.py
```

For detailed security testing options:

```bash
python security_test.py --help
```

See the `SECURITY_TESTING.md` file for a complete guide to security testing.

## Preparing for Production

### Environment Configuration for Production

When deploying to production, set these environment variables:

```
DEBUG=False
SECRET_KEY=your_secure_random_key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

This will automatically enable:
- Strict CSP settings
- HTTPS redirection
- HTTP Strict Transport Security
- Secure cookie settings

### For Docker Deployment

1. Build the Docker image:
```bash
docker build -t scientist-collab .
```

2. Run the container:
```bash
docker run -p 8000:8000 -e DEBUG=False -e SECRET_KEY=your_secure_key scientist-collab
```

### For Azure Deployment

1. Create Azure App Service
2. Configure MySQL database on Azure
3. Update environment variables
4. Deploy using GitHub Actions or Azure DevOps

## Badge System Installation

We've implemented a badge system that rewards users for their activity on the platform:

1. Apply database migrations:
   ```
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

1. **Publication Master** - Published at least 5 scientific publications
2. **Liked Author** - Received at least 10 likes on your publications
3. **Favorite Creator** - Your publications were added to favorites 5 times
4. **Active Replier** - Posted at least 15 replies in forum discussions
5. **Popular Scientist** - Reached 10 followers on your profile
6. **Complete Profile** - Filled out all profile information fields
7. **Diverse Scientist** - Participated in discussions across all forums

## Theme Toggle

The platform supports both light and dark modes. To style new components:

```css
body[data-theme="dark"] .your-component,
html[data-theme="dark"] .your-component {
    background-color: #1e1e1e;
    color: #e9ecef;
}
```

## Visualizers

AxiomX includes interactive data visualizers for scientific data:
- Wave simulators
- 3D data structure visualizers
- Custom visualization components

These components facilitate better understanding of complex scientific concepts through interactive visual representations.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 