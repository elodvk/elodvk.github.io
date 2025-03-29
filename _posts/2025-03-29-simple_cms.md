---
title: Building a simple Content Management System (CMS) 
categories: [Homelab]
tags: [ubuntu,linux,lamp,apache,nysql,php,cms]
author: bilash
---

Building a Content Management System (CMS) can be a great way to manage content for your website. Whether you're building a personal blog, portfolio, or even a small business website, having a CMS lets you manage your content without touching code every time you need to update something.

In this post, we'll walk you through the steps of building a basic **CMS** using **PHP** and **MySQL**. We’ll cover everything from setting up the database to creating a simple admin panel for adding, editing, and deleting content.

## Step 1: Set Up Your MySQL Database

The first step is to create the database where your content will be stored.

### 1.1. Create a New Database

Log in to your MySQL server and create a new database:

```sql
CREATE DATABASE cms_db;
```

### 1.2. Create a Table for Pages

Now, create a table that will store the content for your CMS. The table will store the title, content, and timestamp of each page.

```sql
USE cms_db;

CREATE TABLE pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3. (Optional) Create an Admin Table

If you want to manage your CMS with an admin login, create a users table:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
```

You can insert a test admin user:

```sql
INSERT INTO users (username, password) VALUES ('admin', 'admin_password');
```

Remember to hash passwords in production!

## Step 2: Set Up File Structure

Here’s a simple structure for your CMS project:

```
/cms_project/
    /config/
        db_connect.php
    /admin/
        index.php
        add_page.php
        edit_page.php
    /public/
        index.php
        page.php
    /includes/
        header.php
        footer.php
```

### Step 3: Set Up Database Connection

In the config/ folder, create a `db_connect.php` file to handle your database connection.

```php
<?php
$servername = "localhost";
$username = "bilbo";  // Your MySQL username
$password = "your_password";  // Your MySQL password
$dbname = "cms_db";  // Your database name

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
```

## Step 4: Display Pages on the Frontend

In `public/index.php`, we’ll display the pages dynamically.

```php
<?php
include('../config/db_connect.php');

// Fetch all pages
$sql = "SELECT * FROM pages";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "<h2><a href='page.php?id=" . $row['id'] . "'>" . $row['title'] . "</a></h2>";
        echo "<p>" . substr($row['content'], 0, 150) . "...</p>"; // Show a preview
    }
} else {
    echo "No pages found.";
}

$conn->close();
?>
```

In `public/page.php`, display the full content when a user clicks on a page title:

```php
<?php
include('../config/db_connect.php');

// Get page ID from URL
$page_id = $_GET['id'];

// Fetch the page content
$sql = "SELECT * FROM pages WHERE id = $page_id";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $page = $result->fetch_assoc();
    echo "<h1>" . $page['title'] . "</h1>";
    echo "<p>" . $page['content'] . "</p>";
} else {
    echo "Page not found.";
}

$conn->close();
?>
```

## Step 5: Admin Panel

Let’s create an admin panel where you can add, edit, and delete pages.

### 5.1. Admin Login

Create a simple login system in `admin/index.php`:

```php
<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    include('../config/db_connect.php');

    $username = $_POST['username'];
    $password = $_POST['password'];  // For production, use hashed password!

    $sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $_SESSION['logged_in'] = true;
        header("Location: add_page.php");
    } else {
        echo "Invalid credentials!";
    }

    $conn->close();
}
?>

<form method="POST" action="">
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Login</button>
</form>

```

### 5.2. Add a New Page

Create `admin/add_page.php` for adding new pages:

```php
<?php
session_start();
if (!isset($_SESSION['logged_in'])) {
    header("Location: index.php");
    exit;
}

include('../config/db_connect.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'];
    $content = $_POST['content'];

    $sql = "INSERT INTO pages (title, content) VALUES ('$title', '$content')";

    if ($conn->query($sql) === TRUE) {
        echo "New page added successfully!";
    } else {
        echo "Error: " . $conn->error;
    }
    $conn->close();
}
?>

<form method="POST" action="">
    <input type="text" name="title" placeholder="Title" required>
    <textarea name="content" placeholder="Content" required></textarea>
    <button type="submit">Add Page</button>
</form>
```

### 5.3. Edit a Page

Create `admin/edit_page.php` to edit existing pages:

```php
<?php
session_start();
if (!isset($_SESSION['logged_in'])) {
    header("Location: index.php");
    exit;
}

include('../config/db_connect.php');

$page_id = $_GET['id'];

// Fetch existing page data
$sql = "SELECT * FROM pages WHERE id = $page_id";
$result = $conn->query($sql);
$page = $result->fetch_assoc();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'];
    $content = $_POST['content'];

    $sql = "UPDATE pages SET title = '$title', content = '$content' WHERE id = $page_id";

    if ($conn->query($sql) === TRUE) {
        echo "Page updated successfully!";
    } else {
        echo "Error: " . $conn->error;
    }
}

$conn->close();
?>

<form method="POST" action="">
    <input type="text" name="title" value="<?php echo $page['title']; ?>" required>
    <textarea name="content" required><?php echo $page['content']; ?></textarea>
    <button type="submit">Update Page</button>
</form>
```

## Step 6: Delete a Page

You can add a delete option in `admin/pages.php` to remove pages from the database.

```php
<?php
$page_id = $_GET['id'];

include('../config/db_connect.php');

// Delete page
$sql = "DELETE FROM pages WHERE id = $page_id";

if ($conn->query($sql) === TRUE) {
    echo "Page deleted successfully!";
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
?>
```

## Conclusion

In this post, we’ve built a simple CMS using PHP and MySQL, with the following features:

**Frontend**: Display pages and show detailed content when clicked.

**Admin Panel**: Add, edit, and delete pages through a simple admin interface.

This basic CMS can be extended with more advanced features like user authentication (with hashed passwords), WYSIWYG editors, file uploads, and more.

You now have a foundation to build a full-fledged CMS! If you have any questions or need help, feel free to ask in the comments below.


