import React, { useEffect, useState } from "react";
import { Card, Row } from "antd";
import { Line, Pie } from "@ant-design/charts";
import moment from "moment";
import TransactionSearch from "./TransactionSearch";
import Header from "./Header";
import AddIncomeModal from "./Modals/AddIncome";
import AddExpenseModal from "./Modals/AddExpense";
import Cards from "./Cards";
import NoTransactions from "./NoTransactions";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { unparse } from "papaparse";
import { updateDoc, doc } from "firebase/firestore";
import EditTransactionModal from "./Modals/EditTransactionModal";
import { useRef } from "react";
import { deleteDoc} from "firebase/firestore";



const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const transactionTableRef = useRef(null);

  const scrollToTransactions = () => {
    if (transactionTableRef.current) {
      transactionTableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigate = useNavigate();

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const transactionRef = doc(db, `users/${user.uid}/transactions`, transactionId);
  
      await deleteDoc(transactionRef);
  
      setTransactions((prevTransactions) =>
        prevTransactions.filter((transaction) => transaction.id !== transactionId)
      );
  
      calculateBalance();
  
      toast.success("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction.");
    }
  };
  

  const processChartData = () => {
    const balanceData = [];
    const spendingData = {};

    transactions.forEach((transaction) => {
      const monthYear = moment(transaction.date).format("MMM YYYY");
      const tag = transaction.tag;

      if (transaction.type === "income") {
        if (balanceData.some((data) => data.month === monthYear)) {
          balanceData.find((data) => data.month === monthYear).balance +=
            transaction.amount;
        } else {
          balanceData.push({ month: monthYear, balance: transaction.amount });
        }
      } else {
        if (balanceData.some((data) => data.month === monthYear)) {
          balanceData.find((data) => data.month === monthYear).balance -=
            transaction.amount;
        } else {
          balanceData.push({ month: monthYear, balance: -transaction.amount });
        }

        if (spendingData[tag]) {
          spendingData[tag] += transaction.amount;
        } else {
          spendingData[tag] = transaction.amount;
        }
      }
    });

    const spendingDataArray = Object.keys(spendingData).map((key) => ({
      category: key,
      value: spendingData[key],
    }));

    return { balanceData, spendingDataArray };
  };

  const { balanceData, spendingDataArray } = processChartData();
  const showExpenseModal = () => {
    setIsExpenseModalVisible(true);
  };

  const showIncomeModal = () => {
    setIsIncomeModalVisible(true);
  };

  const handleExpenseCancel = () => {
    setIsExpenseModalVisible(false);
  };

  const handleIncomeCancel = () => {
    setIsIncomeModalVisible(false);
  };

  const openEditModal = (transaction) => {
    setTransactionToEdit(transaction);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setTransactionToEdit(null);
  };


  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleEditFinish = async (updatedTransaction) => {
    try {
      const formattedDate = moment(updatedTransaction.date).format("YYYY-MM-DD");

      const updatedAmount = parseFloat(updatedTransaction.amount);

      const transactionRef = doc(db, `users/${user.uid}/transactions`, updatedTransaction.id);

      await updateDoc(transactionRef, {
        name: updatedTransaction.name,
        amount: updatedAmount,
        date: formattedDate,
        tag: updatedTransaction.tag,
      });

      setTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === updatedTransaction.id
            ? { ...transaction, ...updatedTransaction, date: formattedDate, amount: updatedAmount }
            : transaction
        )
      );

      toast.success("Transaction updated successfully!");
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction.");
    }
    closeEditModal();
  };

  const onFinish = async (values, type) => {
    const newTransaction = {
      type: type,
      date: moment(values.date).format("YYYY-MM-DD"),
      amount: parseFloat(values.amount),
      tag: values.tag,
      name: values.name,
    };

    setIsExpenseModalVisible(false);
    setIsIncomeModalVisible(false);

    try {
      const newDocId = await addTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id: newDocId };
      setTransactions((prevTransactions) => [...prevTransactions, transactionWithId]);
      calculateBalance();
    } catch (error) {
      console.error("Error adding new transaction:", error);
    }
  };

  const calculateBalance = () => {
    let incomeTotal = 0;
    let expensesTotal = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        incomeTotal += transaction.amount;
      } else {
        expensesTotal += transaction.amount;
      }
    });
    const current = incomeTotal - expensesTotal;
    setIncome(incomeTotal);
    setExpenses(expensesTotal);
    setCurrentBalance(incomeTotal - expensesTotal);
    if (current < 0) {
      toast.warning("Warning: Your balance is negative!");
    }
  };

  useEffect(() => {
    calculateBalance();
  }, [transactions]);

  async function addTransaction(transaction, many) {
    try {
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/transactions`),
        transaction
      );
      console.log("Document written with ID: ", docRef.id);
      if (!many) {
        toast.success("Transaction Added!");
      }
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      if (!many) {
        toast.error("Couldn't add transaction");
      }
      throw e;
    }
  }


  async function fetchTransactions() {
    setLoading(true);
    if (user) {
      const q = query(collection(db, `users/${user.uid}/transactions`));
      const querySnapshot = await getDocs(q);
      let transactionsArray = [];
      querySnapshot.forEach((doc) => {
        transactionsArray.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionsArray);
      toast.success("Transactions Fetched!");
    }
    setLoading(false);
  }

  const balanceConfig = {
    data: balanceData,
    xField: "month",
    yField: "balance",
  };

  const spendingConfig = {
    data: spendingDataArray,
    angleField: "value",
    colorField: "category",
  };


  const cardStyle = {
    boxShadow: "0px 0px 30px 8px rgba(227, 227, 227, 0.75)",
    margin: "2rem",
    borderRadius: "0.5rem",
    minWidth: "400px",
    flex: 1,
  };

  function exportToCsv() {
    const csv = unparse(transactions, {
      fields: ["name", "type", "date", "amount", "tag"],
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="dashboard-container">
      <Header />
      {loading ? (
        <Loader />
      ) : (
        <>
          <Cards
            currentBalance={currentBalance}
            income={income}
            expenses={expenses}
            showExpenseModal={showExpenseModal}
            showIncomeModal={showIncomeModal}
            cardStyle={cardStyle}
            scrollToTransactions={scrollToTransactions}
          />

          {transactions.length === 0 ? (
            <NoTransactions />
          ) : (
            <Row gutter={16}>
              <Card bordered={true} style={cardStyle}>
                <h2>Financial Statistics</h2>
                <Line {...{ ...balanceConfig, data: balanceData }} />
              </Card>

              <Card bordered={true} style={{ ...cardStyle, flex: 0.45 }}>
                <h2>Total Spending</h2>
                {spendingDataArray.length === 0 ? (
                  <p>Seems like you haven't spent anything till now...</p>
                ) : (
                  <Pie {...{ ...spendingConfig, data: spendingDataArray }} />
                )}
              </Card>
            </Row>
          )}

          {/* Transaction Table Section */}
          <div ref={transactionTableRef}>
            <TransactionSearch
              transactions={transactions}
              exportToCsv={exportToCsv}
              fetchTransactions={fetchTransactions}
              addTransaction={addTransaction}
              openEditModal={openEditModal}
              handleDeleteTransaction={handleDeleteTransaction}
            />
          </div>

          <AddExpenseModal
            isExpenseModalVisible={isExpenseModalVisible}
            handleExpenseCancel={handleExpenseCancel}
            onFinish={onFinish}
          />
          <AddIncomeModal
            isIncomeModalVisible={isIncomeModalVisible}
            handleIncomeCancel={handleIncomeCancel}
            onFinish={onFinish}
          />
          {isEditModalVisible && transactionToEdit && (
            <EditTransactionModal
              isVisible={isEditModalVisible}
              handleCancel={closeEditModal}
              transactionData={transactionToEdit}
              onFinish={handleEditFinish}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
