# Server Health Check Monitor

A simple, self-hosted monitoring solution using GitHub Actions to check your server's health and send Discord notifications on status changes.

![Example Discord Notification](https-user-images-githubusercontent-com-9507986-189782531-1e9b2b4f-7c1a-4b0f-8b0f-7f6d8a7c2b0e.png) <!-- It's a great idea to add a real screenshot of your notification here -->

## Features

- **Automated Health Checks:** Runs on a schedule you define (e.g., every 5 minutes).
- **Discord Notifications:** Sends alerts for server downtime, recovery, and performance warnings.
- **Configurable:** Easily adjust timeouts, retry attempts, and notification settings in a single JSON file.
- **Status Badge:** Includes a live status badge for your project's README.

## Quick Start

1.  **Fork this Repository:** Click the "Fork" button to create your own copy.

2.  **Configure Secrets:** In your new repository, go to `Settings` > `Secrets and variables` > `Actions` and add the following **repository secrets**:
    - `DISCORD_WEBHOOK_URL`: The webhook URL for your Discord channel.
    - `SERVER_HOST`: Your server's hostname or IP address.
    - `SERVER_PORT`: The port your health check endpoint is listening on.

3.  **Customize Configuration (Optional):** Edit `config/monitoring.json` to change the check interval, endpoint path, or response time thresholds.

    ```json
    {
      "monitoring": {
        "check_interval": "*/5 * * * *",
        "endpoint": "/api/health"
      },
      "health_check": {
        "max_response_time_ms": 5000
      }
    }
    ```

4.  **Enable Actions:** GitHub Actions should be enabled by default on your fork. The monitor will start running on the schedule defined in `config/monitoring.json`.

## Status Badge

To add a live status badge to any Markdown file, use the following snippet, replacing `YOUR_USERNAME` and `YOUR_REPO` with your GitHub details:

```markdown
![Server Status](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/status/server-status.json)
```

The badge will automatically update to show whether your server is **Online** or **Offline**.

## Manual Testing

You can manually trigger a workflow run to test your setup:
1.  Go to the **Actions** tab in your repository.
2.  Select the **Server Health Check** workflow.
3.  Click **Run workflow**. You can check the box to force a notification for testing purposes.

## Security

- **Use Secrets:** Never hardcode your server IP, port, or webhook URL in the workflow files. Use GitHub's encrypted secrets.
- **Firewall:** For best security, configure your server's firewall to only allow traffic on the monitored port from [GitHub's IP ranges](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses).

## License

This project is licensed under the MIT License.
