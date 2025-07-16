# Gathering Breached Credentials with Breach-Parse

In red team operations and passive reconnaissance, understanding an organization's exposure from public data breaches is critical. Breached credentials can lead to immediate access through password reuse. **Breach-Parse** is a powerful tool designed to help you efficiently parse through massive data breach compilations to find credentials related to your target.

**Disclaimer**: Accessing and using data from breaches carries significant legal and ethical implications. This guide is for educational purposes within the context of professional and authorized security testing. Always act ethically and within the law.

---
## What is Breach-Parse? 🛠️

Breach-Parse is a set of Python scripts created by Erik Hjelm. Its primary function is to take the massive, unsorted text files found in data breach compilations (like the famous "Collection #1") and index them into a clean, searchable database. This allows you to quickly query for all credentials associated with a specific domain.

* **The Problem**: A single breach compilation can contain billions of lines in multi-gigabyte text files, making a simple `grep` command incredibly slow and inefficient.
* **The Solution**: Breach-Parse processes these files once, creating an indexed database that can be queried almost instantly.

---
## The Workflow: From Raw Data to Queried Results

The process involves three main steps: downloading the breach data, parsing it into a database, and then querying that database.

### Step 1: Acquiring the Breach Data

You first need the raw data. Breach compilations are often shared via torrents. A well-known example is **"Collection #1"**, a massive set of breaches that is a good starting point. You must find and download these files yourself.

* **Important**: Be extremely careful when downloading these files. Use a virtual machine or a sandboxed environment, as the sources can be untrustworthy.
* **File Structure**: Typically, you will have a directory full of `.txt` files containing data in `email:password` or `username:password` formats.

### Step 2: Setting Up and Running Breach-Parse

Once you have the data, you can use the tool to parse it.

1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/ErikHjelm/Breach-Parse.git](https://github.com/ErikHjelm/Breach-Parse.git)
    cd Breach-Parse
    ```

2.  **Run the Parser (`parse.py`)**:
    You point the `parse.py` script to the directory containing your downloaded breach files. The `-d` flag specifies the database file you want to create.
    ```bash
    # This command tells parse.py to process all .txt files in the /path/to/breaches/
    # directory and save the indexed results into a database named 'breaches.db'
    ./parse.py -i /path/to/breaches/ -d breaches.db -t txt
    ```
    * **`-i /path/to/breaches/`**: The input directory with your raw `.txt` files.
    * **`-d breaches.db`**: The name of the SQLite database file to be created.
    * **`-t txt`**: Specifies the file type to parse.

    **Note**: This process can take a very long time—potentially hours or even days—depending on the size of the breach compilation and the performance of your computer. This is a one-time cost.

### Step 3: Querying the Database (`query.py`)

After the database is built, you can instantly search it for credentials related to your target domain using the `query.py` script.

* **Objective**: To find all email addresses and passwords associated with a specific domain (e.g., `targetcompany.com`).
* **Example Usage**:
    ```bash
    # Search the database for any entries matching the domain 'targetcompany.com'
    ./query.py -d breaches.db -q targetcompany.com
    ```
    * **`-d breaches.db`**: Specifies the database file you created.
    * **`-q targetcompany.com`**: The query string you are searching for.

### The Output

The `query.py` script will output a clean list of email addresses and their associated breached passwords, which looks something like this: