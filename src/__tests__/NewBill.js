import { screen, fireEvent } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import firestore from "../app/Firestore";
import firebase from "../__mocks__/firebase";
import { ROUTES } from "../constants/routes";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the input image is propagated into handleChangeFile", () => {
      // create a function that just punts the request to the router
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const html = NewBillUI();
      document.body.innerHTML = html;

      // add mock for the calls in handleChangeFile
      firestore.storage.ref = jest.fn((e) => {
        expect(e).toBe("justificatifs/"); // the filename variable will be empty in containers/NewBill.js

        // we have to return an object that has a put method
        let rv = new Object();
        rv.put = (file) => {
          expect(file.name).toBe("myimage.jpg");
          // return an empty promise just to be able to call then on it
          return new Promise((a) => {});
        };
        return rv;
      });

      // create the bill instance
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: firestore,
        localStorage: localStorageMock,
      });

      // overwrite the change event with the jest wrapper
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // set the input file to our file
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["myimage.jpg"], "myimage.jpg", { type: "image/jpeg" }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(firestore.storage.ref).toHaveBeenCalled();
    });

    test("On submit, it creates a new bill", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const html = NewBillUI();
      document.body.innerHTML = html;

      // create the bill instance
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: firestore,
        localStorage: localStorageMock,
      });

      firestore.store.collection = (e) => {
        expect(e).toBe("bills");

        let rv = new Object();
        rv.add = (e) => {
          expect(e.pct).toBe(20);
          expect(e.status).toBe("pending");
          return new Promise((a) => {});
        };
        return rv;
      };

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// POST new bills integration test (based on example in dashboard)
describe("Given I am a user connected as Employee", () => {
  describe("When I create new fee", () => {
    test("then new bill posts to api", async () => {
      const spyPost = jest.spyOn(firebase, "post");
      const newBill = {
        id: "12345sdfsf",
        email: "test@email.com",
        type: "Travels",
        name: "TestName",
        amount: 100,
        date: "2023-03-10",
        vat: "17",
        pct: 20,
        commentary: "Test Commentary",
        commentAdmin: "Also test comment",
        fileUrl:
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fsimple.wikipedia.org%2Fwiki%2FLink&psig=AOvVaw1K9RuqB2S0tWkfsdRxKltJ&ust=1681562648476000&source=images&cd=vfe&ved=0CBEQjRxqFwoTCPjGvpSzqf4CFQAAAAAdAAAAABAE",
        fileName: "Testfilename",
        status: "pending",
      };
      const bills = await firebase.post(newBill);
      expect(spyPost).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(5);
    });
    test("posting new bill fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("posting new bill fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
