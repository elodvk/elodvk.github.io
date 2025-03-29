---
title: 'How to Connect PHP to MySQL: A Step-by-Step Guide'
categories: [Homelab]
tags: [ubuntu,linux,lamp,apache,nysql,php]
---

# How to Connect PHP to MySQL: A Step-by-Step Guide

In this guide, we'll walk through how to connect your PHP script to a MySQL database. Whether you're building a simple website or a dynamic web application, connecting to a MySQL database is an essential step. Let's dive in!

## Step 1: Install MySQL and PHP

Before starting, ensure that both **MySQL** and **PHP** are installed on your system. 

- If you are working locally, you can install software bundles like [XAMPP](https://www.apachefriends.org/index.html) or [WAMP](https://www.wampserver.com/en/) that come with both MySQL and PHP pre-installed.
- If you're working on a live server, make sure both are properly configured.

## Step 2: Create a MySQL Database

To interact with a MySQL database, you need to have one created first.

1. **Access MySQL**: Log into your MySQL server. You can do this via the MySQL command line or use a tool like [phpMyAdmin](https://www.phpmyadmin.net/).

2. **Create a database**:
    ```sql
    CREATE DATABASE mydatabase;
    ```
   Replace `mydatabase` with the name of your database.

## Step 3: Create a MySQL User and Grant Permissions

Next, you need to create a MySQL user who will be allowed to interact with the database.

1. **Create a user**:

    ```sql
    CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
    ```

   Replace `'username'` and `'password'` with your desired MySQL username and password.

2. **Grant privileges**:

    ```sql
    GRANT ALL PRIVILEGES ON mydatabase.* TO 'username'@'localhost';
    ```

3. **Flush privileges**:

    ```sql
    FLUSH PRIVILEGES;
    ```

4. If you want to verify the current privileges of the user 'bilbo', you can run the following command inside MySQL:

    ```sql
    SHOW GRANTS FOR 'username'@'localhost';
    ```

    This will display the current permissions granted to the user. If you see that the user does not have the necessary permissions, you can grant them as described earlier.




## Step 4: Write PHP Code to Connect to MySQL

Now that we have the database and user set up, it's time to write some PHP code to connect to MySQL. There are two common methods to do this: **mysqli** and **PDO**. Below are examples of both.

### Method 1: Using `mysqli`

1. **Create a PHP file** (e.g., `db_connect.php`).
2. **Write the connection code**:

    ```php
    <?php
    // Database configuration
    $servername = "localhost";  // or the IP address of your MySQL server
    $username = "username";     // replace with your MySQL username
    $password = "password";     // replace with your MySQL password
    $dbname = "mydatabase";     // replace with your database name

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    echo "Connected successfully";
    ?>
    ```

### Method 2: Using `PDO`

1. **Create a PHP file** (e.g., `db_connect_pdo.php`).
2. **Write the connection code**:

    ```php
    <?php
    // Database configuration
    $servername = "localhost";  // or the IP address of your MySQL server
    $username = "username";     // replace with your MySQL username
    $password = "password";     // replace with your MySQL password
    $dbname = "mydatabase";     // replace with your database name

    try {
        // Create a PDO connection
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        // Set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "Connected successfully";
    }
    catch(PDOException $e) {
        echo "Connection failed: " . $e->getMessage();
    }
    ?>
    ```

### What's the Difference Between `mysqli` and `PDO`?

- **`mysqli`** is a procedural and object-oriented interface. It's MySQL-specific and easy to use for beginners.
- **`PDO`** is a database-agnostic interface that supports multiple databases. It’s better for projects that might switch databases or need more flexibility.

## Step 5: Test Your Connection

Upload your PHP script to your server or run it locally (if using XAMPP or WAMP). If the connection is successful, you will see the message **"Connected successfully"**.

If there's an issue with the connection, you will see an error message indicating what went wrong.

## Step 6: Close the Connection

It's always a good practice to close your database connection once you're done interacting with the database.

- **For `mysqli`**:
    ```php
    $conn->close();
    ```

- **For `PDO`**:
    ```php
    $conn = null;
    ```

## Conclusion

In this guide, we covered the steps to connect PHP to a MySQL database using both the `mysqli` and `PDO` extensions. Now you can begin interacting with your database by querying and manipulating data in your PHP scripts!

Happy coding!
