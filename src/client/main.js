const template = /* html */ `
<div class="m-3">
  <h1 class="text-center">IDX GAS EP10</h1>
  <button onclick="getData()" class="btn btn-danger">Click</button>
  <br />
  <br />
  <form onsubmit="login(event)">
    <div class="mb-3">
      <label>Username</label>
      <input type="text" class="form-control" name="username" />
    </div>
    <div class="mb-3">
      <label>Password</label>
      <input type="password" class="form-control" name="password" />
    </div>
    <button class="btn btn-primary" type="submit" >Login</button>
  </form>

</div>
`;

document.getElementById("app").innerHTML = template;

const apiUrl =
  "https://script.google.com/macros/s/AKfycbzGNTV6kHoqr-B7FYEb5OfFtIsYP5fnWADTHfeplqLn8BaT6Pz7wEroI2NYt4JMzvXF1Q/exec?path=";
const app = document.getElementById("app");

const getData = async () => {
  console.log("getData: ");
  const res = await fetch(`${apiUrl}/getdata`);
  const data = await res.json();
  console.log("data: ", data);
};

const login = async (event) => {
  event.preventDefault();
  console.log("login: ");

  const formData = {
    username: event.target.username.value,
    password: event.target.password.value,
  };

  console.log("formData: ", formData);

  const res = await fetch(`${apiUrl}/login`, {
    method: "post",
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  console.log("data: ", data);
};