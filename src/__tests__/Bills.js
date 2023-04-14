import { fireEvent, screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firebase from "../__mocks__/firebase"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;
      //to-do write expect expression
    });
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When Bills object is created", () => {
    test("Then it is present in the DOM", () => {
      const html = "<div> </div>";
      document.body.innerHTML = html;
      const myBills = new Bills({ document });
      const isMyBills = myBills ? true : false;
      expect(isMyBills).toBeTruthy();
    });
    test("Then I can view the image of the bill", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const myBills = new Bills({ document });
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`);
      $.fn.modal = jest.fn();
      fireEvent.click(iconEye);
      expect($.fn.modal).toHaveBeenCalled();
    });

    test("Then I can create a new bill", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const myBills = new Bills({ document });
      myBills.onNavigate = jest.fn();
      const buttonNewBill = document.querySelector(
        `button[data-testid="btn-new-bill"]`
      );
      fireEvent.click(buttonNewBill);
      expect(myBills.onNavigate).toHaveBeenCalled();
    });

    test("When loading the loading page is displayed", () => {
      const html = BillsUI({ data: [], loading: "loading" });
      document.body.innerHTML = html;
      expect(document.querySelector("#loading")).toBeTruthy();
    });
    test("If there is an error the error page displays", () => {
      const html = BillsUI({ data: [], error: "error" });
      document.body.innerHTML = html;
      expect(screen.getByTestId("error-message")).toBeTruthy();
    });
    
  });
});

// Get bills integration test
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(firebase, "get")
       const bills = await firebase.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
