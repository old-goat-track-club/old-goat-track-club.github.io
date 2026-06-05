# old-goat-track-club.github.io

Official website for OGTC


## Development steps

1. Clone the repo (use GitHub Desktop if inexperienced)
2. Create a branch
3. Make changes
4. Push to branch
5. Create PR
6. Get reviews

## Testing instructions

### Docker method (Reccommended)

I suggest using this method because it removes any issues with installation versions - Alex

Docker is a prerequisite, please follow the [installation instructions](https://docs.docker.com/desktop/).

#### Running the site

In VS Code, open a new Terminal and run the command:

```
docker compose up -d
```

This will create 2 containers:

- `ogtc-dev` is the main developer container
    - Go to `localhost:8000` in a web browser to see the site.
- `ogtc-watch` is the format watcher container.
    - Some time after editing, auto-formats project files.
    - Can cause saving issues if your editor doesn't refresh the file before your next edit.

To stop the containers, run the command

```
docker compose down
```

### NPM method

Install `npm` and use `npm run <script>` where `<script>` is one of the scripts from package.json. 

`dev` will run the vite dev server

`format` will run the formatter once

`format-watch` will start the file watcher that runs the formatter 5 seconds after a file has been saved.

### Live Server VS Code Plugin

This is an option

### Python one-liner

python3 -m http.server 8001
To develop, clone repo.
Then from repo root run `npm install`.
For local dev build `npm run dev`.

## Image Optimizer Tool

Make sure your git state is clean, just in case you need to revert. The script will overwrite all existing image files.

To build the script, run this command:

`docker compose build image-optimizer`

To activate the script in overwrite mode, run this command:

`docker compose run --rm image-optimizer`

It does not resize images (yet), only compresses.