/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

let previousData = null;

async function fetchData() {
  const url = "./data";
  const response = await fetch(url);
  return await response.json();
}

function eq(x, y) {
  return JSON.stringify(x) === JSON.stringify(y);
}

function doughnut(canvasId, data) {
  const canvas = document.getElementById("canvas_" + canvasId);
  const ctx = canvas.getContext("2d");
  if (canvas.chart === undefined) {
    canvas.chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [{
          data: data.data,
          backgroundColor:["rgb(16, 97, 195)","rgb(234, 53, 46)","rgb(255, 141, 0)", "rgb(64, 177, 75)", "rgb(146, 16, 173)"]
        }],
        labels: data.labels,
      },
      options: {
        legend: {
          display: true,
          position: "right",
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              const numbers = data.datasets[tooltipItem.datasetIndex].data;
              const total = numbers.reduce((pv, cv) => pv + cv, 0);
              const percent = Math.round(100. * (numbers[tooltipItem.index] / total));
              const label = data.labels[tooltipItem.index];
              return label + ": " + percent + "%";
            },
          }
        },
        plugins: {
          labels: {
            render: "value",
            fontSize: 14,
            fontColor: "black",
            fontFamily: "sans-serif",
          }
        },
      },
    });
  } else {
    canvas.chart.data.datasets[0].data = data.data;
    canvas.chart.data.labels = data.labels;
    canvas.chart.update();
  }
}

function doughnuts(data) {
  const stats = data.stats;
  doughnut("ticket_per_milestone", stats.milestones);
  doughnut("per_dom_component", stats.dom);
  doughnut("bug_status", stats.status);
  doughnut("m2_milestones", stats.statusM2);
}

function updateMilestonesTotal(data) {
  const span = document.getElementById("total-milestones");
  span.innerText = data.stats.totalMilestones;
}

function mkTableTitle(M) {
  const title = document.createElement("div");
  title.setAttribute("class", "title");
  const span = document.createElement("span");
  span.innerText = M + " Breakdown";
  title.append(span);
  return title
}

function mkTable(M, data) {
  const div = document.createElement("div");
  div.setAttribute("class", "table");
  const title = mkTableTitle(M);
  const table = document.createElement("table");
  div.appendChild(title);
  div.appendChild(table);

  const thead = document.createElement("thead");
  table.appendChild(thead);
  const trHead = document.createElement("tr");
  thead.appendChild(trHead);
  for (let col of data.header) {
    const th = document.createElement("th");
    th.innerText = col;
    trHead.appendChild(th);
  }
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  for (let [priority, summary, resolution, assignee, bugid, milestone, status] of data.data) {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.innerText = priority;
    tr.appendChild(td1);

    const td2 = document.createElement("td");
    td2.innerText = summary;
    tr.appendChild(td2);

    const td3 = document.createElement("td");
    td3.innerText = resolution;
    tr.appendChild(td3);

    const td4 = document.createElement("td");
    td4.innerText = assignee;
    tr.appendChild(td4);

    const td5 = document.createElement("td");
    const a = document.createElement("a");
    a.setAttribute("href", "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugid);
    a.setAttribute("target", "_blank" + bugid);
    a.innerText = bugid
    td5.appendChild(a);
    tr.appendChild(td5);

    const td6 = document.createElement("td");
    td6.innerText = milestone;
    tr.appendChild(td6);

    const td7 = document.createElement("td");
    td7.innerText = status;
    tr.appendChild(td7);

    tbody.appendChild(tr);
  }
  return [div, thead, tbody];
}

function resize(thead, tbody) {
  const scrollWidth = tbody.offsetWidth - tbody.clientWidth + 1;
  thead.style.width = `calc(100% - ${scrollWidth}px)`;
}

function updateTables(data) {
  const tables = data.tables.milestones;
  const allTables = document.getElementById("all-tables");
  const milestones = ["M2", "M3", "?", "Future", "M1"];
  const children = allTables.children;
  const add = children.length == 0;
  for (let i in milestones) {
    const M = milestones[i];
    const [table, thead, tbody] = mkTable(M, tables[M]);
    if (add) {
      allTables.appendChild(table);
    } else {
      allTables.replaceChild(table, children[i]);
    }
    resize(thead, tbody);
  }
}

function updateAll(data) {
  doughnuts(data);
  updateMilestonesTotal(data);
  updateTables(data);
}

function update() {
  fetchData().then(data => {
    if (!eq(data, previousData)) {
      previousData = data;
      updateAll(data);
    }
  });
}

function init() {
  const x = fetchData();
  window.addEventListener("DOMContentLoaded", function() {
    x.then(data => {
      previousData = data;
      updateAll(data);
      window.setInterval(update, 300000);
    });
  });
}
