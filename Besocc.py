from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

try:
    # Set up Chrome options with SSL error suppression
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    # Set up WebDriver
    chromedriver_path = r'D:\Scrapers\chromedriver-win64\chromedriver.exe'
    service = Service(chromedriver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Navigate to the login page
    driver.get("https://www.besoccer.com/login")
    
    # Handle the cookie banner with explicit wait
    try:
        cookie_banner = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, "//div[@id='qc-cmp2-ui']"))
        )
        agree_button = cookie_banner.find_element(By.XPATH, "//button[@mode='primary']")
        agree_button.click()
    except Exception as e:
        print("Could not handle the cookie banner:", str(e))
    
    # Wait for and interact with login form
    login_panel = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//div[@class='panel form login']"))
    )
    
    username_input = login_panel.find_element(By.XPATH, "//input[@id='name']")
    password_input = login_panel.find_element(By.XPATH, "//input[@id='password']")
    login_button = driver.find_element(By.XPATH, "//div[@class='custom-button ph0']")
    
    username_input.send_keys("Apune")
    password_input.send_keys("japune#83")
    login_button.click()
    
    # Wait for a brief period to ensure successful login
    print("Login successful, waiting for 5 seconds...")
    time.sleep(5)

except Exception as e:
    print(f"An error occurred: {str(e)}")

finally:
    # Close the browser
    try:
        driver.quit()
    except:
        pass