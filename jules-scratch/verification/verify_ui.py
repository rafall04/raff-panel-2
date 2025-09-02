import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the dashboard page
        page.goto("http://localhost:3000/dashboard", timeout=60000)

        # Wait for the main content to be visible
        expect(page.get_by_role("heading", name="Status Overview")).to_be_visible(timeout=30000)

        # Give it a second to make sure everything is rendered
        time.sleep(2)

        # Screenshot in dark mode (default)
        page.screenshot(path="jules-scratch/verification/screenshot-dark.png")

        # Find and click the theme toggle button
        theme_toggle_button = page.get_by_role("button", name="Toggle theme")
        expect(theme_toggle_button).to_be_visible()
        theme_toggle_button.click()

        # Click the "Light" option
        light_mode_option = page.get_by_role("menuitem", name="Light")
        expect(light_mode_option).to_be_visible()
        light_mode_option.click()

        # Give it a second to make sure the theme has changed
        time.sleep(2)

        # Screenshot in light mode
        page.screenshot(path="jules-scratch/verification/screenshot-light.png")

        print("Screenshots taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
