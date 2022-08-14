package StepDefs;

import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.TestNGException;

public class CllicktTcallSteps {
    private static final String BTN_CALL = "button-call";
    private WebDriver driver;
    WebElement btnClick2Call;

    @Given("Launch the browser")
    public void openDemoPage(){
        System.out.println("Launch the browser");
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();

        //DesiredCapabilities capabilities = DesiredCapabilities.chrome();

        options.addArguments("--no-sandbox"); // Bypass OS security model, MUST BE THE VERY FIRST OPTION
        //options.addArguments("--headless");
        options.addArguments("start-maximized"); // open Browser in maximized mode
        options.addArguments("disable-infobars"); // disabling infobars
        options.addArguments("--disable-extensions"); // disabling extensions
        options.addArguments("--disable-gpu"); // applicable to windows os only
        options.addArguments("--disable-dev-shm-usage"); // overcome limited resource problems
        //options.merge(capabilities);

        driver = new ChromeDriver(options);

        String baseUrl = "https://click2call.cpaasapi.com/";
        driver.get(baseUrl);
    }

    @When("Click talk to sales")
    public void setup(){
        System.out.println("Click talk to sales");
        btnClick2Call = driver.findElement(By.className(BTN_CALL));
        btnClick2Call.click();

    }
    @And("Enter {string} as calling user")
    public void collectAppDetails(String name){
        System.out.println("Enter {string} as calling user");
        WebElement clientIdTxtBox = driver.findElement(By.id("clientId"));
        clientIdTxtBox.sendKeys(name);
    }
    @Then("Silent Login and connect")
    public void register(){
        System.out.println("Silent Login and connect");
        WebElement btnRegister = driver.findElement(By.id("btnSubmit"));
        btnRegister.click();
        WebDriverWait tmpDriver = new WebDriverWait(driver, 1000);
        btnClick2Call = tmpDriver.until(ExpectedConditions.visibilityOfElementLocated(By.className(BTN_CALL)));
    }

    @And("Start call")
    public void startCall(){
        System.out.println("Start call");
        if (btnClick2Call.isDisplayed() & btnClick2Call.isEnabled()){
            try {
                Thread.sleep(2000);
            }
            catch (Exception e){
                throw new TestNGException("Unexpected behavior");
            }
            btnClick2Call.click();
            return;
        }
        throw new TestNGException("Start call is not visible");
    }

    @And("wait {int} sec")
    public void wait(int time) {
        System.out.println("Waiting...." + time);
        try {
            Thread.sleep(time * 1000);
        }
        catch (Exception e){
            throw new TestNGException("Unexpected behavior");
        }
    }

    @And("end call")
    public void endCall() {
        System.out.println("end call");
        WebDriverWait tmpDriver = new WebDriverWait(driver, 1000);
        WebElement btnEndCall = tmpDriver.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[@id=\"root\"]/div/div[2]/div[5]/div/div[2]/div/section/div/div[4]/div[2]/img")));
        btnEndCall.click();
    }

    @After
    public void close(){
        driver.close();
        driver.quit();
    }
}
