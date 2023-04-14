import { screen, fireEvent } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import firestore from "../app/Firestore";
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
